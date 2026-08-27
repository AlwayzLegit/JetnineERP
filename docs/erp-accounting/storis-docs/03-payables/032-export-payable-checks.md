---
title: Export Payable Checks
article_id: 15202012946324
section: 03-payables
index: 32
url: https://storis.zendesk.com/hc/en-us/articles/15202012946324-Export-Payable-Checks
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > Payables > Process Checks > Export Checks > Export Payable Checks

Use this routine to create an export file for approved payments and print them via a third party accounting package. This is feature is only available when the STORIS AP module is active.

This routine can also be processed from Select and Approve Bills for Payment by clicking the Print Checks button on the Check Review tab. When you use this process, the Bank, Date, Time, and File Name fields are populated and inactive.

BankBankClick the Arrow button to select the bank for the checks you want to export for printing by a third party accounting package. Only banks that have the Export Checks field enabled in Bank Settings are displayed.

DateDate

Select the date of the check run to export.

Time/CodeTime/Code

This dynamic field displays the Batch Code for multiple payment batches, and Batch Time for a single batch payment.

File Name File NameThis is a display only field and displays the file name that is used for this check run. The format is CheckRunExport_1_MM-DD-YYYY_HH:MM:SS.xml; in this example the 1 indicates the bank number that you have selected for the check run in the Bank field.

RunRun

Click the Run button and the check export xml fils is written to the TPA_EXPORT directory on the server and the check run status is set to Exported. If the file exists already, a message is displayed and asks if you want to overwrite. If you select "Yes", the current date and time are appended to the existing file name and the file is saved as a backup before writing the new file. If you select "No", the process is exited.

NOTE: If a check export file is created but not processed by the third party accounting package, the check run needs to be deleted in STORIS.

The check export file contains a pending check number to indicate which AP bills are assigned to which check.

For refund checks, the Vendor Remit To Number passed is always the Refund Vendor. The customer name and address information is passed in the Vendor Remit To Name and Address fields. The key to the record in the CUSTOMER file is passed in the Customer Number field.

Important: The bank account number is encrypted in the STORIS database; it is not encrypted in the check export file.
