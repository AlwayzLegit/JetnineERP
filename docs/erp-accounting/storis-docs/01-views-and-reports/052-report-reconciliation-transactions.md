---
title: Report Reconciliation Transactions
article_id: 15203128885268
section: 01-views-and-reports
index: 52
url: https://storis.zendesk.com/hc/en-us/articles/15203128885268-Report-Reconciliation-Transactions
source: STORIS Help Center (storis.zendesk.com)
---

Access

Accounting > Payables > Reconcile Bank Transactions > Report Reconciliation Transactions

Use this routine to report on bank reconciliation transactions for a specified bank within a range of dates. The report selects records based on the search criteria entered. The report sorts by transaction date and then by document number. Once the run-time options have been selected, choose Run to produce the report.

Bank BankEnter the code of the bank for which to report on bank reconciliation transactions. If you click on the Arrow, a list of banks set up for reconciliation appears, from which you can choose.

Starting Date Starting DateEnter the starting date of the date range for which you want to report on bank reconciliation transactions. If you leave this field blank, the system assumes the starting date to be equal to the As Of date as recorded in the selected Bank record.

Ending Date Ending DateEnter the ending date of the date range for which you want to report on bank reconciliation transactions. If you leave this field blank, the system assumes the ending date to be equal to the most current record in the selected Bank record.

Ending Balance Ending BalanceUse this field to calculate an ending balance proof. The process subtracts the bank balance from the ending balance you specify here. The ending balance and ending balance proof display below the bank balance in the summary version of this report.

Reporting Mode Reporting Mode

Specify the mode for which to run this report. You have the following options:

Run Summary Only

Run Detail Only

Run Both

Include Reconciled Only Include Reconciled OnlyTo include only reconciled records, check the box. To include all records, leave the box blank.

Report Status as of Ending Date Report Status as of Ending DateThis field is available only when you indicate an Ending Date. If you check the box at this field, the report shows the status of each check (open, clear) as it was on the specified ending date. If you leave the box blank, the report shows the current status of the checks reported.

Send Output to Send Output toThe output destination of the report displays. To change the output destination, click on the Actions button and select Output Settings.

Export Path Export PathIf you select either the Personal Report Viewer ( PRV), Excel Export, or ASCII Export, this field displays the pre-set computer drive and folder location to which the system exports the report data. You cannot edit the export path using this process.

Report Columns

Data comes from the Bank Reconciliation File.

Document Number - the check or deposit number.

Reference / Comment - any available description text.

Description - the description that would have posted to the General Ledger. Origin defines where the posting originated (for example, EOD or the Manual entry type code). The date is the transaction date of the posting.

Transaction Type - the reconciliation transaction type.

Debit - to maintain consistency with banks reports, this column displays any amounts stored in the Bank Reconciliation record as a credit transaction. The system subtracts these amounts from the running balance in the Balance column.

Credit - displays any amounts stored in the Bank Reconciliation record as a debit transaction. The system adds these amounts to the running balance in the Balance column.

Issued - the recorded date of the transaction.

Status - indicates either CLEAR or OPEN based on the status of the "MATCHED" flag.

Origin - the source of the posting. For deposits, EOD displays for deposits, APC for checks, and a manual posting code for manual postings.

Balance - the balance

Reconciliation Date - the date a specific transaction was reconciled.

Locn - the store location from which the deposit is coming.

NOTE: The totals on this report represent only that data which was included in the report based on entry of run-time criteria.

The descriptions for each total (for example, Deposits, Checks, etc.) come from the Short Description field of the corresponding Transaction Type record. Hence, for each Transaction Type listed in the detail information, a total displays here.

For records that do not include the location, the Locn column is null.

For data resulting from the reapplication of mis-applied funds, the report displays in the following manner:

(1) If the bank used in the misapplied transaction is the same as the bank designated for the reapplication, the transaction does not appear in the report.

(2) If you reapplied funds using different banks, the transferred amount appears under the Debit column for original bank and the Credit column for the receiving bank.

Bank Reconciliation Summary

You define the balance (or balance forward) in the Bank file for each bank record where reconciliation takes place. This is the balance from “the beginning of time” (that is, the balance as of the last time that the reconciliation file was cleared and recalculated by the purge process). If the starting date specified in the run-time options is later than the last purge date, all prior transactions are used to calculate a beginning balance as of the report's requested starting date.

Similar to the above totals (on the detail register), the summary information is based on totals by transaction type and the descriptions of these totals comes from the Short Description for each Transaction Type. In this case, however, the totals are broken down by transaction into cleared and open.
