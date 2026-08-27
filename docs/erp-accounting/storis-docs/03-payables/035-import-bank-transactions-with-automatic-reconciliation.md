---
title: Import Bank Transactions with Automatic Reconciliation
article_id: 15202013123220
section: 03-payables
index: 35
url: https://storis.zendesk.com/hc/en-us/articles/15202013123220-Import-Bank-Transactions-with-Automatic-Reconciliation
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > Payables > Reconcile Bank Transactions > Reconcile Bank Transactions Automatically > Import Bank Transactions with Automatic Reconciliation

Use this routine to import bank reconciliation data received from a bank into STORIS. This process is known as automatic reconciliation or automated bank download. The data must be in a CSV-type spreadsheet. First, copy the spreadsheet onto a local PC that has access to STORIS. Then, run this routine.

First, the process attempts to match transactions one-on-one with its corresponding record in the Bank Reconciliation file. To facilitate this function, the system uses the cross reference table linking the BAI codes and Transaction Type codes.

Next, the process attempts to match up deposits based on one-to-many and/or many-to-one relationships. Again, to facilitate this function, the system uses the cross reference table linking the BAI codes and Transaction Type codes.

Bank BankEnter the code of the bank from which the spreadsheet came. If you click on the Search button, a list of banks set up for bank reconciliation appears from which you can choose.

Statement Ending Date Statement Ending DateEnter the statement ending date. The program attempts to match any un-reconciled transactions whose transaction date less than or equal to the date you enter here. To include all records regardless of transaction date, leave this field blank.

Path to Spreadsheet Path to SpreadsheetEnter the path-name on your PC to the directory where the spreadsheet resides. If you click on the Action button, you can browse the PC path.

Name of Spreadsheet Name of SpreadsheetEnter the spreadsheet filename (for example, 19MAY.CSV).

At Conclusion of Process

Run Cleared Transaction Report Run Cleared Transaction ReportTo run the Report Cleared Transactions routine at the conclusion of the import, check the box. Otherwise, leave the box blank.

Run Error Transactions Report Run Error Transactions ReportTo run the Report Reconciliation Errors routine, check the box. Otherwise, leave the box blank.

If all records have been reconciled, a message appears with the following options:

Abort - abort the process, for example if you selected the wrong bank. No records update.

Ignore - clear the BANK.REC.AUTO file so you can import the spreadsheet for a new month. All reconciled transactions remain flagged as reconciled.

If unmatched records exist, a message appears with the following options:

Abort - abort the process, for example if you selected the wrong bank. No records update.

Ignore - "un-reconcile" any transactions that have already reconciled and clear the BANK.REC.AUTO file so the process can import the spreadsheet for the same month you had been working on previously. In this way, you can start the reconciliation process over again from the beginning.

Buttons

Run - begin the process.

Clear - remove all entered information and start over.

Exit - return to the menu without performing any updates.
