---
title: Report Analysis of Account Activity
article_id: 15202552864020
section: 01-views-and-reports
index: 23
url: https://storis.zendesk.com/hc/en-us/articles/15202552864020-Report-Analysis-of-Account-Activity
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > General Ledger > Report Analysis of Account Activity

Tabs: Selection, Sorting

Use this routine to report account activity for specified accounts for a range of dates, for both open and closed fiscal periods. Once the report criteria have been selected, click Run to produce the report. This report can also be run as a scheduled process.

NOTE: In order to access this screen, individual users must have permission via the No Inquiry Allowed field in General Ledger User Permissions. This field must be unchecked or users receive warning that they do not have clearance to use this process.

If you choose Excel® as your output option at the Send Output To field, the report includes the following columns:

Reference Type - displays one of the following:

- CUS (customer)

- VEN (vendor)

- WLO (location)

- FRV (finance provider)

- STA (staff)

- null (no reference type)

Reference Number - displays the key to a file, based on the value in the Reference Type column.

Reference Name - displays the reference name based on the value in the Reference Type column.

Document - displays the document number with a 3 character prefix:

- APB (AP bill)

- ORH (order, including service)

- POH (purchase order)

- CDR (cash drawer)

- PRO (product)

- VOI (vendor open item)

- COI (customer open item)

- FRA (FR account number)

NOTE: If you run the report for sources APVE and APVM only, the Reference Number and Reference Name columns contain display-only vendor numbers and vendor names, respectively.

Selection

Company CompanyEnter the company for which you want to run this report. The default company appears. If multi-company processing is not active, this field is inactive and you must accept the default company. If multi-company processing is active, you can edit this field. If you click on the Arrow, a list of companies appears from which you can choose.

Account Account

Enter the root accounts for which you want to run this report. If you leave this field blank, you choose all root accounts. If you click on the Arrow, a list of root accounts appears from which you can choose. If you click on the Action button, you access the Multiple GL Account Selection screen, from which you can choose one or more root accounts.

For each root account you select, the report includes all associated sub-accounts and cost centers. If you specify a root account, you clear and inactivate the following fields:

Account Group

Account Sub-Class

Account Class

NOTE: The lists of accounts that appear at this field are restricted by the General Ledger User Permissions routine.

Sub-Account Sub-Account

Enter the sub-accounts for which you want to run this report. This field is active only if you use sub-accounts. If you leave this field blank, you choose all sub-accounts. If you click on the Arrow, a list of sub-accounts appears from which you can choose. If you click on the Action button, you access the Multiple GL Sub-Account Selection screen, from which you can choose one or more sub-accounts.

For each sub-account you select, the report includes all associated cost centers. If you specify no root accounts, the report includes all root accounts associated with the specified sub-accounts.

NOTE: The lists of sub-accounts that appear at this field are restricted by the General Ledger User Permissions routine.

Cost Center Cost Center

Enter the cost centers for which you want to run this report. If you leave this field blank, you choose all cost centers. If you click on the Arrow, a list of cost centers appears from which you can choose. If you click on the Action button, you access the Multiple GL Cost Center Selection screen, from which you can choose one or more cost center.

If you specify no root accounts, the report includes all root accounts associated with the specified cost centers. If you specify no sub-accounts, the report includes all sub-accounts (if any) associated with the specified cost centers.

NOTE: The lists of cost centers that appear at this field are restricted by the General Ledger User Permissions routine.

Account Group Account GroupEnter the account groups (if any) for which you want to run this report. If you leave this field blank, you select all account groups. If you click on the Arrow, a list of account groups appears from which you can choose. If you select an account group, the Account Sub-Class and Account Class fields fill in accordingly and become inactive.

Account Sub-Class Account Sub-ClassEnter the account sub-classes (if any) for which you want to run this report. If you leave this field blank, you select all account sub-classes. If you click on the Arrow, a list of account sub-classes appears from which you can choose. If you select an account sub-class, the Account Class field fills in accordingly and becomes inactive.

Account Class Account ClassEnter the account classes (if any) for which you want to run this report. If you leave this field blank, you select all account classes. If you click on the Arrow, a list of account classes appears from which you can choose.

Source SourceEnter the GL sources for which you want to run this report. If you leave this field blank, you choose all GL sources. If you click on the Arrow, a list of GL sources appears from which you can choose. If you click on the Action button, you access the Multiple GL Source Selection screen, from which you can choose one or more GL sources.

Date Code Date CodeClick on the Arrow button to view a list of date codes, then select the code that best indicates the time period on which to base your report.

Starting Date Starting DateIf you select CUS at the Date Code field, you activate this field. Use this field to specify the start date of the custom date range for which you want to run this report. If you click on the Calendar Icon, you can select a date from the calendar that appears.

If you select another date code instead of CUS, this field fills in based on that selection and you cannot edit this field.

Ending Date Ending DateIf you select CUS at the Date Code field, you activate this field. Use this field to specify the end date of the custom date range for which you want to run this report. If you click on the Calendar Icon, you can select a date from the calendar that appears.

If you select another date code instead of CUS, this field fills in based on that selection and you cannot edit this field.

Summary Only Summary OnlyTo print only a single line for each account for the selected period, check the box. Otherwise, a single line prints for each posting to the account.

NOTE: This option is not available for the PRV.

Include No Activity Include No ActivityTo include accounts with no activity during the specified period, check the box. Otherwise, leave the box blank.

ActionsActions

View Fiscal Periods

Sorting

Sort/Page Break Sort/Page Break

Use these fields to specify your sort sequence and to insert page breaks (if any) between sorts. You can select any combination of the following:

Class

Sub-Class

Group

Account

Account

Sub-Account

Cost Center

Date

Source

If you select the Account option, you cannot select any of the account element options at subsequent Sort fields. The Account option sorts by root account, sub-account, and cost center. |

If you select the Date or Source options, the report includes columns for Post Date and Time. If you do not select one of these as a sort option, the report displays starting and ending balances.

Send Output to Send Output toThe output destination of the report displays. To change the output destination, click on the Actions button and select Output Settings.

Export Path Export PathIf you select either the Personal Report Viewer (PRV), Excel Export, or ASCII Export, this field displays the pre-set computer drive and folder location to which the system exports the report data. You cannot edit the export path using this process.
