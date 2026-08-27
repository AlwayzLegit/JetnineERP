---
title: Report Posted Transactions
article_id: 15203112898068
section: 01-views-and-reports
index: 47
url: https://storis.zendesk.com/hc/en-us/articles/15203112898068-Report-Posted-Transactions
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > General Ledger > Report Posted Transactions

Use this report to list

all GL transactions posted since the last end-of-day cycle

all GL transactions posted for a specified range of dates

the detail for one or more single GL batches

As mentioned above, this report provides a daily detail listing of GL transactions posted since the last end-of-day process was run. Based on the setting at the End-of-Day Posted Transactions field in the General Ledger Control Settings, this report either

generates as part of the End-of-Day process, reporting all transactions,

generates automatically as part of the End-of-Day process, reporting only manual transactions,

does not generate automatically as part of the End-of-Day process, or

suppresses the report and the generation of the GL Post Register records.

The report sorts by company and GL source, with breaks and subtotals for each. Each company starts on a new page, and after each company total, a GL account summary prints. The report includes either the header comment or the line item remarks, but not both. Line comments print if they exist. Once the run-time options have been selected, choose Run to produce the report.

NOTE: If multiple documents are linked to a posting, the Document column displays the first document number and then "..." to indicate multiple documents are involved in the posting.

Posted Since Last End-of-DayPosted Since Last End-of-DayTo include only transactions posted since the last end-of-day cycle, check the box. Otherwise, leave the box blank. If you check this box, you inactivate the Starting Date and Ending Date fields.

BatchBatchUse this field to specify one or more individual batches for which you want to run the report. If you click on the Search button, you access the View Multiple Postings screen, from which you can select one or more batches. If you click on the Action button, you access the Multiple GL Batch Selection Window, from which you can select one or more batches. Note that if you enter one or more batches at this field, you inactivate all other fields.

Date Code Date CodeClick on the Arrow button to view a list of date codes, then select the code that best indicates the time period on which to base your report.

Start Date Start DateIf you select CUS at the Date Code field, you activate this field. Use this field to specify the start date of the custom date range for which you want to run this report. If you click on the Calendar Icon, you can select a date from the calendar that appears.

If you select another date code instead of CUS, this field fills in based on that selection and you cannot edit this field.

End Date End DateIf you select CUS at the Date Code field, you activate this field. Use this field to specify the end date of the custom date range for which you want to run this report. If you click on the Calendar Icon, you can select a date from the calendar that appears.

If you select another date code instead of CUS, this field fills in based on that selection and you cannot edit this field.

SourceSourceEnter the GL sources for which you want to run this report. If you leave this field blank, you choose all GL sources. If you click on the Arrow, a list of GL sources appears from which you can choose. If you click on the Action button, you access the Multiple GL Source Selection screen, from which you can choose one or more GL sources.

CompanyCompany

Enter the companies (if any) for which you want to run this report. If multi-company processing is active, you can specify any valid company. If multi-company processing is not active, the default company appears and you cannot edit the field.

If you leave this field blank, you choose all companies. If you click on the Arrow, a list of companies appears from which you can choose. If you click on the Action button, you access the Multiple Company Selection screen, from which you can choose one or more companies.

Account Account

Enter the root accounts for which you want to run this report. If you leave this field blank, you choose all root accounts. If you click on the Arrow, a list of root accounts appears from which you can choose. If you click on the Action button, you access the Multiple GL Account Selection screen, from which you can choose one or more root accounts.

NOTE: The lists of accounts that appear at this field are restricted by the General Ledger User Permissions routine.

Sub-Account Sub-Account

Enter the sub-accounts for which you want to run this report. This field is active only if you use sub-accounts. If you leave this field blank, you choose all sub-accounts. If you click on the Arrow, a list of sub-accounts appears from which you can choose. If you click on the Action button, you access the Multiple GL Sub-Account Selection screen, from which you can choose one or more sub-accounts.

NOTE: The lists of sub-accounts that appear at this field are restricted by the General Ledger User Permissions routine.

Cost Center Cost Center

Enter the cost centers for which you want to run this report. If you leave this field blank, you choose all cost centers. If you click on the Arrow, a list of cost centers appears from which you can choose. If you click on the Action button, you access the Multiple GL Cost Center Selection screen, from which you can choose one or more cost centers.

NOTE: The lists of cost centers that appear at this field are restricted by the General Ledger User Permissions routine.

Summary Only Summary OnlyTo suppress batch details from this report, check the box. Otherwise, leave the box blank. If you check the box, only the summary prints by company and source.

NOTE: This option is not available for the PRV.

Send Output to Send Output toThe output destination of the report displays. To change the output destination, click on the Actions button and select Output Settings.

Export Path Export PathIf you select either the Personal Report Viewer (PRV), Excel Export, or ASCII Export, this field displays the pre-set computer drive and folder location to which the system exports the report data. You cannot edit the export path using this process.
