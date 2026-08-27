---
title: Import Revolving Plan Deferments
article_id: 15202279426452
section: 04-receivables
index: 55
url: https://storis.zendesk.com/hc/en-us/articles/15202279426452-Import-Revolving-Plan-Deferments
source: STORIS Help Center (storis.zendesk.com)
---

Access

Menu

Schedule a Process > Select Import Revolving Plan Deferments > Actions button > Enter Process Preferences

Use this screen to import multiple revolving plans to be deferred by selecting a spreadsheet from your PC, where each row on the spreadsheet contains information about the customer's account(s). This screen is used when the Import Revolving Plan Deferments process is run on-demand as well as when import preferences are entered while scheduling the import to run through Schedule a Process. Entire plans are deferred; individual payments due cannot be selected. Both past due and current due revolving payments are deferred. Deferment activity is recorded in the Customer Activity Log.

Both the on-demand and scheduled import processes are validated and an error report is generated to record processing errors or invalid data. Rows that do not pass validation are not deferred. As the row passes validation, each revolving payment being deferred moves from short term to long term. Included in this payment are principal, interest, insurance, and finance fees. Payments or credits applied to a deferred payment due reduce the amount deferred by that payment/credit amount. The general ledger is updated with one batch per row on the imported spreadsheet.

The spreadsheet template used to import the data can be obtained from the Revolving Plan Deferments section of the STORIS support site. The spreadsheet has one mandatory column, Account Number. See below for further information about using spreadsheets provided by STORIS:

When accessing the STORIS secure web site, you are prompted to enter the User ID and Password established when you registered for access to the Client Services web site. After logging in, go to the Documentation > Vision > Spreadsheet Downloads page and click on the link for the version of the spreadsheet you need. Use the File Download window to Save the file to your PC.

Because each column represents a field in STORIS, be sure not to alter the format of the worksheets when entering your data.

The spreadsheet's column titles contain information about the structure of your entries (e.g., maximum character length, etc.). Simply hover the mouse pointer over a column heading, and the comments appear for that column.

Enter your data into the worksheet, using a different row for each account number.

When complete, save the file as a tab-delimited .txt file.

You can then use this routine to import the file into STORIS.

NOTE: When importing via the scheduled process, the spreadsheet should be saved to the same path entered in Enter Process Preferences (Actions button when Import Revolving Plan Deferments is selected in the Process field of Schedule a Process).

When importing on demand, the spreadsheet should be saved to the path entered in the Path field of this screen.

Path

Enter the path of the spreadsheet to import. The path must exist when entering it, and the spreadsheet must exist at the time the import is run. The path entered the last time the Import Revolving Plan Deferments process was run defaults here.

To choose the location of the spreadsheet stored on your PC, select "PC" in the accompanying drop down menu. Click the Browse button to select the file in the File to Import window that opens. The selected path displays in the Path field.

To choose the location of the spreadsheet stored via an NFS drive, select "NFS" in the accompanying drop down menu. The Browse button becomes inactive. Enter the file location directly into the Path field.
