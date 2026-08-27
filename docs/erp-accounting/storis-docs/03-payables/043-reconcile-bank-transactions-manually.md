---
title: Reconcile Bank Transactions Manually
article_id: 15202028426388
section: 03-payables
index: 43
url: https://storis.zendesk.com/hc/en-us/articles/15202028426388-Reconcile-Bank-Transactions-Manually
source: STORIS Help Center (storis.zendesk.com)
---

(Manual Clearing Processing)

AccessAccess

Accounting > Payables > Reconcile Bank Transactions > Reconcile Bank Transactions Manually

Tabs: Set Filters, Reconcile

Use this routine to manually match and clear bank reconciliation activity, for example activity that was not reconciled automatically during the Import Bank Transactions with Automatic Reconciliation process.

You select records for one bank at a time and specify a range of dates (typically, the bank statement dates). Filtering and sorting criteria are available for selection, including an option to suppress the display of records that have already been reconciled. The screen displays cleared and/or un-cleared transactions that were either recorded within STORIS or included in a CSV-type spreadsheet provided by your bank and downloaded into STORIS.

NOTE: You can use this routine both for banks set for automatic reconciliation (using a bank-distributed spreadsheet) and for manual reconciliation. However, some of the functionality differs depending on how you set the bank.

Use the Report Reconciliation Transactions process to determine which transactions have been cleared and which transactions remain open.

For banks set to automatic reconciliation, you can match any number of recorded transactions to any number of bank transactions (that is, one-to-many, many-to-one, or many-to-many). The screen displays a running proof of reconciled debits vs. credits for the current session, and an automatic reconciliation update occurs each time the proof amount equals zero. Also, the routine allows you to change the filtering criteria, but only while the proof amount equals zero.

For banks set to manual reconciliation, no automatic matching occurs. You can mark any number of transactions, and you can change the filtering criteria at any time.

Bank BankSelect the bank for which you want to manually reconcile bank transactions. If you click on the Search button, a list of banks set up for bank reconciliation appears from which you can choose.

Statement Start Statement StartEnter the start date of the bank statement containing the transaction you want to reconcile.

Statement End Statement EndEnter the end date of the bank statement containing the transaction you want to reconcile.

Starting Statement Balance Starting Statement Balance

Once you specify a bank and the statement start and end dates, the starting balance displays. The starting balance calculates as the beginning balance from the bank record plus all transactions whose reconciled date precedes the date specified at the Statement Start field. This amount should match the starting balance on your printed bank statement.

NOTE: This process includes un-reconciled records whose transaction date precedes the Statement Start date. In this way, you can enter the true statement start date and still see all transactions for this period that are available for reconciliation.

This field is inactive if the selected bank is set for Automated Bank Download.

Ending Statement Balance Ending Statement BalanceUse this field to enter the ending balance from the printed bank statement, if desired, using up to 13 numeric characters. Entry can be positive or negative, and displays with two decimal places. Note that this field is inactive if the selected bank is set for Automated Bank Download.

Ending Balance / Transaction Proof Ending Balance / Transaction ProofThe proof amount (if available) displays.

For banks not set for Automated Bank Download, the label displays as Ending Balance Proof. Once you specify a bank, a statement start date, a statement end date, and an ending balance, the ending balance proof displays, calculated as the starting balance less the ending balance plus any transactions with a reconciled date within the specified date range.

For banks set for Automated Bank Download, the label for this field displays as Transaction Proof. When the label displays as Transaction Proof, this field displays a running proof (if available) of reconciled debits vs. credits for the current session, and an automatic reconciliation update occurs each time the proof amount equals zero. Also, the routine allows you to change the filtering criteria, but only while the proof amount equals zero.

Note that if you click on a line in the grid, to get the proof amount to 0 you must also click on the offsetting line or create a new one.

Set Filters

Use the fields on this tab to filter out the transactions you do not want to reconcile. Once you specify your filtering criteria, the results display on the Reconciliation tab.

Show Cleared Show ClearedTo include cleared transactions in the display, check the box. Otherwise, leave the box blank.

Note that this filter does not consider the reconciled or voided date, only that the transaction is reconciled or voided. That is, if you check the box at this field, records that are currently flagged as reconciled or voided within the selected set of records display in the grid - even if the reconciled or voided date falls after the statement end date. If you leave this field blank, reconciled and voided records within the selected set of records do not display in the grid even if the reconciled date or voided date falls after the statement end date.

Sort By Sort By

Select the method by which to sort the result of your search. You have the following options:

Posted Date

BAI Code

Document Number

Transaction Type

If you select a sort method other than Posted Date, the program applies a secondary sort by posted date.

BAI Code BAI Code

Enter the BAI (if any) to which to restrict the search. If you click on the Arrow, a list of BAI codes appears from which you can choose.

If you specify a BAI code, the program displays only bank transactions containing both the indicated code and all STORIS recorded transactions that contain the associated transaction type code.

NOTE: This field is active only for banks set up for automatic reconciliation.

Transaction Type Transaction Type

Enter the transaction type (if any) to which to restrict the search. If you click on the Arrow, a list of transaction types appears from which you can choose.

NOTE: The cross reference table linking the BAI codes with the Transaction Type codes allows you to perform the matching based on subsets of the total transaction data.

Containing Text Containing TextUse this field to restrict your search results to transactions containing the exact text within the Description/Reference field from the CSV spreadsheet download. You can specify any combination of characters. Note that the program also selects STORIS-recorded transactions with no description and/or manually created transactions containing the specified text string.

Document Number

Equal To Equal To

Use this field to restrict your search results to transactions whose document number matches the string you enter here. Note that if you enter a response here, you inactivate the following two fields.

Less Than Less Than

Use this field to restrict your search results to transactions whose document number is less than the string you enter here.

You can use this field with the following field to indicate a range of document numbers. This field is active only if no response exists at the Equal To field.

Greater Than Greater Than

Use this field to restrict your search results to transactions whose document number is greater than the string you enter here.

You can use this field with the previous field to indicate a range of document numbers. This field is active only if no response exists at the Equal To field.

Amount

Equal To Equal ToUse this field to restrict your search results to transactions whose amount matches the string you enter here. Note that if you enter a response here, you inactivate the following two fields.

Less Than Less Than

Use this field to restrict your search results to transactions whose amount is less than the string you enter here.

You can use this field with the following field to indicate a range of transaction amounts. This field is active only if no response exists at the Equal To field.

Greater Than Greater Than

Use this field to restrict your search results to transactions whose amount is greater than the string you enter here.

You can use this field with the previous field to indicate a range of transaction amounts. This field is active only if no response exists at the Equal To field.

NOTE: You can change your selection criteria at any time during the reconciliation process (for auto-reconciled banks, the proof amount must be zero), and you can use all criteria in any combination.

Record selection includes records from both the Bank Reconciliation file (by transaction type) and the Bank Reconciliation Auto file (by BAI code) for the selected bank. When you specify a transaction type code, the program uses all associated BAI codes. Likewise, when you specify a BAI code, the program uses all associated transaction types.

Reconcile

This process selects bank reconciliation records

not yet reconciled or voided as of the statement start date and

with a transaction date on or before the statement end date.

To reconcile the transaction indicated on a given row, double-click on that row and choose Select from the menu that appears. If the item has not yet been reconciled, a "P" appears in the Clr column, indicating a pending transaction, and the Proof amount recalculates based on that row's amount. The calculation adds locally-generated records to the proof amount and subtracts bank-generated records.

To remove a mark (that is, a P or R), double-click on the row. The proof amount recalculates accordingly. To view more information on a grid item, double-click on the row and select More from the menu that appears. The Reconciliation Detail Display - Read Only screen appears.

NOTE: For banks set up for automatic reconciliation, each time the proof amount calculates back to zero, all rows marked P change to R. The program groups rows marked R into a reconciled "batch" so that if you double-click on a row marked R, the program removes the R from all transactions within that batch.

To create adjusting transactions, click on the Actions button.

To view additional information on a grid item, double-click on the row and select More. One of the following screens displays:

Un-reconciled items - the Reconciliation Detail Display - Read Only screen appears, displaying complete information for the selected record

Reconciled items - the Review Reconciled Batch - Read Only screen appears, displaying all transactions within the "batch" of the selected record.

To mark all cleared (R) transactions appropriately, and exit the screen, click on Save. To remove all data from the Clr column and reset the proof to zero, click on Clear. To end the session without performing any updates, click on Exit. The Delete button is not available on this screen.

Grid InformationGrid Information

Clr - displays an asterisk (*) for any records within the current batch that have already been reconciled either automatically or during a previous session. If you select a row with an asterisk, a prompt appears asking if you want to "un-reconcile" the previously reconciled batch. If you say Yes, you clear the matched flag in all related documents. This update takes place at the end of the process, so you can still void prior to updating.

Note that previously reconciled records and voided records display with an asterisk in the Clr column even if the reconcile date or void date falls after the statement end date. However, the calculation of the Ending Balance Proof always uses the reconciled or voided date.

Doc Nbr - document number. This is typically a check number or a deposit number, but may also be a number which represents a manually entered transaction, for example a manual adjustment.

Date - the date of record. For records returned by the bank, this date comes from the bank record. For records recorded on the system, this is the date of record, for example check date or deposit date.

Amount - the signed (that is, positive or negative) amount of the transaction represented on that row.

Location - the location of the deposit.

BAI - the bank BAI code. This field is populated only for transactions that originated from the bank (that is, transactions created by the CSV spreadsheet import process.

Type - the STORIS Transaction Type code. This field populates with the appropriate transaction type code. For bank-generated transactions, the system cross references the transaction type with the BAI code to determine the appropriate type code. For bank reconciliation records, if the deposit type field is populated, the transaction type appends to the deposit type.

Reference - the first few words of the detail reference information returned by the bank. Note that when creating manual reconciliation records, you can add detail comments.

ActionsActions

Create an Adjusting Record

Import and Match Bank Transactions - Use this option to import the spreadsheet of bank transactions. This option is available only when automatic reconciliation is not being used (i.e., Automated Bank Download in Bank Settings is unchecked).
