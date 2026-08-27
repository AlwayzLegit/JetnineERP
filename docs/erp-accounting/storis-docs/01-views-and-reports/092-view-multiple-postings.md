---
title: View Multiple Postings
article_id: 15295212741268
section: 01-views-and-reports
index: 92
url: https://storis.zendesk.com/hc/en-us/articles/15295212741268-View-Multiple-Postings
source: STORIS Help Center (storis.zendesk.com)
---

Access

Accounting > General Ledger > GL Views > View Multiple Postings

Use this inquiry to search the history of posted GL batches. You can use the various GL account elements as your search criteria.

NOTE: The GL account fields below may be affected by GL Account Security.

Company CompanyEnter the code of the company associated with GL accounts you want to view. If multi-company processing is active, you can enter any valid company code. If not, the default company appears and you can not edit it. If you click on the Arrow, a list of valid companies appears from which you can make a selection. If you click on the Search button, the Multiple Company Selection screen appears from which you can choose one or more companies.

Source SourceEnter the code of the source associated with GL accounts you want to view. If you click on the Arrow, a list of valid companies appears from which you can make a selection. If you click on the Search button, the Multiple Source Selection screen appears from which you can choose one or more sources. If you leave the field blank, you select all sources.

Account AccountEnter one or more root accounts to view. If you click on the Arrow, a list of valid root accounts appears from which you can make a selection. If you click on the Search button, the Multiple GL Account Selection screen appears from which you can choose one or more accounts. If you leave the field blank, you select all root accounts.

Sub-Account Sub-Account

Enter one or more sub-accounts to view. If you click on the Arrow, a list of valid sub-accounts appears from which you can make a selection. If you click on the Search button, the Multiple GL Sub-Account Selection screen appears from which you can choose one or more accounts. If you leave the field blank, you select all sub-accounts.

NOTE: This field is active only if using sub-accounts.

Cost Center Cost CenterEnter one or more cost centers to view. If you click on the Arrow, a list of valid cost centers appears from which you can make a selection. If you click on the Search button, the Multiple GL Cost Center Selection screen appears from which you can choose one or more cost centers. If you leave the field blank, you select all cost centers.

Remark RemarkEnter the remark or a portion of the remark for which you want to search for GL batches. All entries must be surrounded by brackets ([ ]). If you enter a portion of a remark, you must use wildcards. This field searches on both the batch comments and line item remarks.

This field is optional.

Amount Amount

Enter a specific amount for which to search, or enter an amount range by using the greater-than (>) or less-than (<) operators before the number. You can also search for debit or credit amounts by appending the amount you enter with D or C, respectively. For example, to search for

postings less than $50, enter <50.00.

debit amounts of $100, enter 100D.

credit amounts greater than $100, enter >100C.

Document DocumentEnter the document number for which you want to search for GL batches. For example, depending on the origin of the GL batch, you can enter an invoice number or a customer number.

Start Date Start Date

Enter the starting date of the date range for which you want to search for posted GL batches. If you leave this field blank, the system assumes the earliest possible date (that is, the beginning of the current fiscal year). If you click on the calendar to the right of the field, the Calendar Icon appears from which you can select a date.

Note that if you use both the Start Date and End Date fields, the dates you enter must fall within the same fiscal year.

End Date End Date

Enter the ending date of the date range for which you want to search for posted GL batches. If you leave this field blank, the system assumes the latest possible date (that is, the end of the current fiscal year). If you click on the calendar to the right of the field, the Calendar Icon appears from which you can select a date.

Note that if you use both the Start Date and End Date fields, the dates you enter must fall within the same fiscal year.

Summary Batch Summary BatchThis field is active only if using TPA. If you summarize GL batches before transmission (that is, if the Summarize GL Postings field is checked in the TPA Control Settings), you can enter a summary batch number here.

Grid InformationGrid Information

The GL batches that appear are single account postings that meet all the criteria specified. Note that batches may list multiple times if more than one line from the batch meets the search criteria.

To select a batch, double-click on the line in the grid, and then click on select in the little dialog box that appears. You return to the GL Batch Maintenance screen.

The grid contains the following columns:

Batch

Account

Date Entered

Posted Date

Amount

Source

User
