---
title: Import Completed Checks
article_id: 15202011444244
section: 03-payables
index: 36
url: https://storis.zendesk.com/hc/en-us/articles/15202011444244-Import-Completed-Checks
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > Payables > Process Checks > Export Checks > Import Completed Checks

Use this routine to import the completed check run file from the TPA_IMPORT directory on the server. This file contains the completed check information from the third party accounting package required to perform the payment updates in STORIS.

This process can be used to validate the file and report exceptions as well as perform the updates for completed payments.

The import file contains the payment type used by the third party accounting package for each payment. Valid codes for the payment type are SYS (check), ACH (Automated Clearing House), and WIR (wire transfer). All payment types are treated as checks within STORIS.

The pending check number from the export file is cross referenced to the check number used by the third party accounting package in the import file. The check number assigned by the third party accounting package is used as the check number in STORIS. The prefix ACH and WIR is added to ensure the check numbers are unique in STORIS.

NOTE: This process is only available if the Export Payable Checks process has been completed first.

All checks in a check run must be for the same currency. If you have a vendor that needs to be paid in a foreign currency, a separate bank must be created.

Bank BankClick the Arrow button to select the bank for the checks you want to import. Only banks that have been exported via the Export Payable Checks process are displayed. If no check runs have been exported, a message is displayed and the process is exited.

Date Date

Select the date of the check run to export.

Time/Code Time/Code

This dynamic field displays the Batch Code for multiple payment batches, and Batch Time for a single batch payment.

ActionAction

Click the Arrow button to select one of the following options:

Validate Only - the process validates the data in the import file against the existing check for the bank and compiles a list of errors. No updates are performed.

Validate and Perform Updates - the process validates the data and produces the exception report. If a non-fatal error is found, the user can choose to <Continue>, <Ignore> or <Abort>. If a fatal error is found the process is changed to Validate Only mode and displays the exception report with all the errors listed.

If a check or bill is missing from either the check run or import file, all associated data fields and values are listed to aid in evaluation of the mismatch.

File Name File NameThis is a display only field and displays the file name that is used for this check run. The format is CheckRunExport_1_MM-DD-YYYY_HH:MM:SS.xml; in this example the 1 indicates the bank number that you have selected for the check run in the Bank field.

Send Output To Send Output ToThis is a display only field and displays the selected output option for the exception report. Click the Actions button to change this option. Type your expanding text here.

Export Path Export PathThis is a display only field and displays the your default export path and file name for the exception report. Click the Actions button to change this path.

RunRun

Click this button to run the Import Completed Checks process.

ActionsActionsOutput Settings

If there are errors; an exception report that is only available during this process, Import Completed Checks Exception Report, is displayed. This report contains the following columns:

Error Type

Pending Check Reference

TPA Check Number

AP Bill

STORIS Check Run Value

Import File Value

Exception
