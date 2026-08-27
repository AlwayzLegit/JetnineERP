---
title: Import Journal Postings
article_id: 15186368850452
section: 02-general-ledger
index: 8
url: https://storis.zendesk.com/hc/en-us/articles/15186368850452-Import-Journal-Postings
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > General Ledger > Import Journal Postings

Use this process to import GL transactions from an Excel® spreadsheet. Each spreadsheet row contains the information required to generate a posting to an individual account. Save the spreadsheet as a tab-delimited text file (.txt) before you import.

Important! STORIS provides a GL Import Spreadsheet containing three worksheets, each formatted for use with the GL Import processes. When importing journal entry data, you must use the Import Journal Postings worksheet provided by STORIS. Click here to access the STORIS secure web site where you can download the GL Import Spreadsheet file. After logging in, go to the Documentation, Vision, Spreadsheet Downloads page and click on the GL Import Spreadsheet button in the GL Import Spreadsheets section. Save the file to your PC. This file contains the Import Journal Postings worksheet. After you enter your data into the worksheet, save it as a tab-delimited text file (.txt) before importing into STORIS.

Also THE FIRST TWO ROWS in the spreadsheet provided by STORIS must NOT be removed! The program imports data beginning with row # three (3).

The maximum amount allowed for a journal entry is $99,999,999.99. If you enter a journal entry amount of 100 million dollars or more, an error message appears and the process aborts.

Default Company Default CompanyEnter the code of the company you want to use in the event the import process encounters an account containing the no cost center indicator. Note that if the process finds a valid cost center for an account, it uses it to determine the company.

PC Path of Spreadsheet PC Path of SpreadsheetEnter the complete PC path of the file to import. If you click on the Action button, the Windows® browse window appears which you can use the identify the PC path.

Post if Non-Fatal Errors Found Post if Non-Fatal Errors FoundTo post GL transaction even if they contain non-fatal errors (see below), check the box. Otherwise, leave the box blank.

Print Error Report Print Error ReportTo print an error report listing fatal and non-fatal errors, check the box. Otherwise, leave the box blank.

Importing the File

The program assigns to a single batch (GL.POST) all transactions that share the same company, source and date, and checks for the following error conditions:

Fatal

• The company does not exist in the Company file.

• The transaction date is not formatted properly or is for a closed period.

• The transaction date is for a closed period.

• The debit or credit amount is not numeric.

• The source does not exist on the GL.SOURCE file

Non-fatal

• The account number does not exist in the GL.ACCOUNT file.

• The source does not exist in the GL.SOURCE file.

• The cost center company does not match the company passed.

If any fatal errors occur, the program aborts and no import takes place. If non-fatal errors occur, the import proceeds if the Post if Non-Fatal Errors Found field is checked. Otherwise, the process aborts. If you check the Print Error Report field, an error report prints. Whether you print the error report or not, you can attempt to fix the errors and rerun the process.

The program flags all batches containing invalid data and does not post them. You can then run the GL Invalid Transaction Report, fix the errors and re-submit for posting.

Print the Error Report

If the program finds errors, one of the following prompts displays:

Fatal Errors Found!

or

Non-Fatal Errors Found!

If the Print Error Report field is checked, the Error Report prints. The report lists both fatal and non-fatal errors along with their row location within the import file.
