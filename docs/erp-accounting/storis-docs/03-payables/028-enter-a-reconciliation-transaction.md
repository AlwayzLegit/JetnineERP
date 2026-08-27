---
title: Enter a Reconciliation Transaction
article_id: 15202013122452
section: 03-payables
index: 28
url: https://storis.zendesk.com/hc/en-us/articles/15202013122452-Enter-a-Reconciliation-Transaction
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > Payables > Reconcile Bank Transactions > Enter a Reconciliation Transaction

If using the Bank Reconciliation feature, use this routine to manually create bank reconciliation records for items that may not appear in the bank file you want to reconcile, for example:

bank service charges

credit card usage fees

You can also use this routine to correct minor reconciliation errors.

Enter the amount of the transaction. To indicate a credit transaction, enter a negative number. If the transaction represents half of an EFT, the other half of the transaction changes when you update this amount.

Bank Bank

Enter the code of the bank for which to create a transaction record. If you click on the Search button, a list of banks set up for reconciliation appears from which you can choose.

NOTE: If you access this routine via the Reconcile Bank Transactions Manually routine, the bank ID defaults and you cannot change it.

Record ID Record ID

To edit an existing record, enter the record ID of the transaction. You can select any existing manually entered adjustment that has not yet been reconciled. If you click on the Search button, a list of existing adjustments displays from which you can choose.

To create a new adjustment, click on the Search button and select 'Create New Record', or just press <Enter> when in the field. "Pending" then displays in the Record ID field. Once you complete the adjustment entry (that is, when you click on Save), the system creates and displays the adjustment key.

Date DateEnter the date of the transactions you want to reconcile. Today's date defaults, but you can change it to any date no earlier than the first day of the current processing (open general ledger) period and no later than today.

Document Number Document NumberEnter the number (if any) of the document you want to reconcile.

Transaction Type Transaction Type

Enter the code of the transaction type for this reconciliation. If you click on the Search button, a list of transaction types appears from which you can choose.

NOTE: When editing an existing record, you cannot change this field. To change the transaction type, you must delete the record and re-enter.

Deposit Type Code Deposit Type CodeEnter the code of the deposit type. If you click on the Search button, a list of deposit types appears from which you can choose.

This field is active only when the transaction type code specified above is a deposit type.

Transfer Bank Transfer BankEnter the transfer bank. If you click on the Search button, a list of banks appears from which you can choose.

This field is active only if the transaction type represents a transfer (that is, has the Transfer Bank Required field checked in the Reconciliation Transaction Type Settings).

Amount AmountEnter the amount of the transaction. To indicate a credit transaction, enter a negative number. If the transaction represents half of an EFT, the other half of the transaction changes when you update this amount.

Post to General Ledger Post to General LedgerTo post this bank reconciliation transaction to general ledger, check the box at this field. Otherwise, leave the field blank.

When creating new bank reconciliation transactions, this field is active and defaults to "checked". When you edit the Transaction Type field above, this field updates based on the setting at the Post to General Ledger field in the Reconciliation Transaction Type Settings, but you can override the update.

When updating or deleting existing bank reconciliation transactions, this field is inactive. If GL postings exist for the record, a check-mark appears here. Otherwise, no check appears here. In this way, the process ensures that if general ledger postings were generated when you created the bank reconciliation transaction, postings will also be generated when you update the transaction.

Detail Reference Information Detail Reference InformationUse this field to enter any detail or reference information about the transaction. Note that when you specify a transfer, the transfer-to bank appears automatically in the field.

If all entries are valid, when you click on Save, the transactions update, and the following occurs:

A posting batch generates to the General Ledger (two batches for EFT transactions).

the 'Cash in the Bank' account for the indicated bank debits or credits accordingly and the offsetting account is taken from the Reconciliation Transaction Type Settings.

if default postings are present and you have security access, the GL Account Entry Screen appears via which you can correct them.

NOTE: When a transfer bank is present (that is, during the creation of a new ETF record), the system creates two records, one in the normal manner and one with the debits and credits reversed for the transfer bank. When changing an existing ETF record, the amount and required General Ledger postings update in both records. When deleting an ETF record, both are deleted.

The Delete button is available only when editing an existing transaction that has not yet been reconciled. When you use the Delete button to remove an existing record, the system posts a reversal of all original postings to the General Ledger. If the transaction represents half of an ETF, the system reverses and deletes both transactions.
