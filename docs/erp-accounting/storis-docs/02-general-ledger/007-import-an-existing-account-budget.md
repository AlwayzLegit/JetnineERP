---
title: Import an Existing Account Budget
article_id: 15186352924052
section: 02-general-ledger
index: 7
url: https://storis.zendesk.com/hc/en-us/articles/15186352924052-Import-an-Existing-Account-Budget
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > General Ledger > Account Budgets > Import an Existing Account Budget

Use this process to import budgets for multiple accounts from an Excel® spreadsheet. You enter your data into a spreadsheet, then convert the spreadsheet to a .TXT file for import into STORIS.

Important! STORIS provides a GL Import Spreadsheet containing three worksheets, each formatted for use with the GL Import processes. When importing budget data, you must use the GL Budget Import worksheet provided by STORIS. Click here to access the STORIS secure web site where you can download the GL Import Spreadsheet file. After logging in, go to the Documentation, Vision, Downloads page and click on the GL Import Spreadsheet button in the GL Import Spreadsheets section. Save the file to your PC. This file contains the GL Budget Import worksheet. After you enter your data into the worksheet, save it as a tab-delimited text file (.txt) before importing into STORIS.

Also THE FIRST TWO ROWS in the spreadsheet provided by STORIS must NOT be removed! The program imports data beginning with row # three (3).

Fiscal Year for Import Fiscal Year for ImportEnter the fiscal year you want to import. If you click on the Arrow, a list of valid fiscal years appears from which you can choose.

PC Path of Spreadsheet PC Path of SpreadsheetEnter the full PC path of the import file.

Overwrite Existing Budgets Overwrite Existing BudgetsTo overwrite existing budget records, check the box. Otherwise, leave the box blank.

The import file contains one row for each budget record to import. The first column contains the complete GL account number including the company number. The remaining columns contain 12 budget amounts including decimal places, for a total of 13 columns. If you do not include decimals, the program assumes you are using whole amounts. Each import file row contains the information required to generate a budget for an individual account. The import process first validates the data in the spreadsheet. If the program finds invalid data, the import process aborts.
