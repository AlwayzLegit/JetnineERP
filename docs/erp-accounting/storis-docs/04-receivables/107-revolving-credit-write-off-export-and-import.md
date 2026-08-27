---
title: Revolving Credit Write-Off Export and Import
article_id: 15202297024148
section: 04-receivables
index: 107
url: https://storis.zendesk.com/hc/en-us/articles/15202297024148-Revolving-Credit-Write-Off-Export-and-Import
source: STORIS Help Center (storis.zendesk.com)
---

Access

Receivables > Revolving Receivables

Use this routine to process revolving credit write-offs; processing these write-offs are done by 1) exporting the data into a spreadsheet, 2) updating the spreadsheet as needed, and 3) importing the spreadsheet. Click Save to initiate the export and import. The GL account associated with the write-offs is established in the Revolving Credit Write-Offs field on the Revolving page of General Ledger Assigned Account Settings.

Export

The export is run to create a spreadsheet of revolving plans eligible to be written off.

The export can be filtered by the State field or the Store Location field on this screen. Additionally, the number of plans exported can be filtered by the Amount Threshold and Inactivity Days settings in Sales Tax Settings.

Once exported, the spreadsheet can be reviewed and plans removed. If there are plans on the spreadsheet that should not be written off, the rows for those plans can be removed from the spreadsheet.

NOTE:Additional plans cannot be added to the spreadsheet and the amount to be written off cannot be changed. The customer's other revolving plan balances are not considered when selecting which revolving plans are eligible to be written off. If one plan has a balance due and another has a credit balance, the credit balance plan is still eligible to be written off.

Only revolving plans without a current due amount are eligible to be selected. Customers with legal codes will not be selected. Customers who are charged off or who are in a non-accrual status are not selected. Revolving plans without any available statement history will not be selected.

Import

The import writes-off the credits on the plans listed on the spreadsheet. Messages and errors from the import are available to print or view in the Report Error Messages process.

In addition to the export and import option, there is an option to clear the current Write-Off Export. If the last export needed additional filtering or the options entered to filter were incorrect, the export can be cleared and a new export created.

Account Account

This read-only field shows the account to which the current user is logged in.

Current Write-Off Current Write-Off

This read-only field displays information about the last export, including the user who created the export and the date and time.

Action Action

Select the type of action to complete. Choose from:

Export New Credit Write-Off

Clear Current Credit Write-Off

Import Current Credit Write-Off

State State

Select the state(s) to which you wish to limit the export. Use the extra Action button to select multiple states. Leave the field blank to select all states. If a state is selected, a store location cannot be selected.

NOTE:This field is unavailable during the import.

Store Location Store Location

Select the store location(s) to which you wish to limit the report. Use the extra Action button to select multiple locations. Leave the field blank to select all locations. If a store location is selected, a state cannot be selected.

NOTE: This field is unavailable during the import.

File File

For an import, use this field to enter the name of the file you wish to import. Click the extra Action button to select a local file.

For an export, use this field to enter the name of the file that will be created by this process.

Path Path

This read-only field shows the local path of the spreadsheet.
