---
title: Report Daily Receipts Register
article_id: 15202676866452
section: 01-views-and-reports
index: 36
url: https://storis.zendesk.com/hc/en-us/articles/15202676866452-Report-Daily-Receipts-Register
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > Receivables > Receivables Reports > Report Daily Receipts Register

Point of Sale > Cash Balancing > Store Manager Balancing Function > Report Daily Receipts Register

This report is based on receipts for tender types that affect G/L, cash, checks, and bank cards. 3rd party financing receipts are included, even though funds have not been "received". Revolving deposits and financing do not appear on this report.

The report shows the details of the sales receipts and a recap of general ledger postings. It shows the

type of transaction (payment/deposit/on-account),

class of transaction (cash, charge, guaranteed/electronic/manual check), and the

amount.

You can run the report for a specific date or for a specified date range. Note this register runs as part of the Generate Daily Reports process. When run this way, the program bases the report information on transactions that occurred since the last daily reports process.

NOTE: The output of this report may be affected by Regional Processing restrictions. That is, you can inquire only about customers and locations to which you have access.

This report utilizes data in the DAILY.DETAIL file. The retention period of this data is controlled via the Daily Receipts Retention Months setting in Accounts Receivable Control Settings. It is then purged by Generate Monthly Reports.

If you choose Basic PDF as the output method, the detail, receivables recap by store, recap by bank, and G/L recap are generate as separate items. Note that only the detail report prints a legend at the end of the report.

Date Code, Start Date, End Date Date Code, Start Date, End Date

For Date Code: Use the Arrow button to view a list of date codes, then select the code that best indicates the time period on which to base your report.

For Start Date and End Date: If you select CUS at the Date Code field, these fields are activated. Use these fields to specify the start date and end date, respectively, of the custom date range for which you want to run this report. If you click on the Calendar Icon, you can select a date from the calendar that appears.

If you select another date code instead of CUS, these fields populate based on that selection and you cannot edit these fields.

Report Type Report Type

Specify a report type. You have the following options:

Detail

Summary

Date Type Date Type

Specify the type of date on which to base the report. You have the following options:

System Date

Transaction Date

District DistrictEnter the code of the district to which to restrict this report. If you click on the Arrow, a list of available districts appears from which you can choose one or more. If you click on the Action button, the Multiple District Selection window appears from which you can choose one or more. If you enter a district at this field, you de-activate the Store field below.

Store StoreEnter the code of the store to which to restrict this report. If you click on the Arrow, a list of available stores appears from which you can choose one or more. If you click on the Action button, the Multiple Location Selection window appears from which you can choose one or more. If you enter a store at this field, you de-activate the District field above.

Print General Ledger Recap Print General Ledger Recap

To include a general ledger recap in the report, check the box at this field. Otherwise, leave the field blank.

Send Output to Send Output toThe output destination of the report displays. To change the output destination, click on the Actions button and select Output Settings.

Export Path Export PathIf you select either the Personal Report Viewer (PRV), Excel Export, or ASCII Export, this field displays the pre-set computer drive and folder location to which the system exports the report data. You cannot edit the export path using this process.
