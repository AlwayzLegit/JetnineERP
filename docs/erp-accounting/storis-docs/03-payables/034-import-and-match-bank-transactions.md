---
title: Import and Match Bank Transactions
article_id: 15202013041428
section: 03-payables
index: 34
url: https://storis.zendesk.com/hc/en-us/articles/15202013041428-Import-and-Match-Bank-Transactions
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Reconcile Bank Transactions Manually > Reconcile tab > global Actions button

Use this routine to upload the spreadsheet of bank transactions. The spreadsheet must be a tab delimited text file.

In PC Path of Spreadsheet, enter the file path of the spreadsheet, or use the associated Action button to choose the file via Windows Explorer. Once the path is entered, click Run to import the spreadsheet. For each row in the spreadsheet, the imported transaction is matched to an un-reconciled transaction in the grid of the Reconcile tab of Reconcile Bank Transactions Manually.

When matching transactions:

· Check transactions use the Transaction Type, Document Number, and Amount.

· All other transaction types use the Transaction Type, Amount, and Date. For the Date, the Plus/Minus Days for Match setting in Bank Settings is considered. Optional fields are matched if populated: Document Number, Location, and Deposit Type Code.

If a match is found, the row is flagged in the Clr column with an 'R' for reconciled.

Since the reconcile process is dependent upon each line being updated with an 'R' and clicking Save to confirm reconciled items, transactions are matched and reconciled to items that are selected based on the settings in the Set Filters tab of Reconcile Bank Transactions Manually. These selected items are displayed in the grid on the Reconcile tab. Manual grid filtering had no effect on the item's ability for reconciliation, so it is recommended that any manual grid filtering be removed and to review the matched items before clicking Save.

An error report lists validation errors as well as imported transactions that were not matched in the grid. The error report may show the following:

· Transaction Type is NULL. This field is mandatory.

· Transaction Type record XXXXX missing from the BANK.REC.TRANS.TYPE file.

· Document Number is NULL. This field is mandatory for CHK type transactions.

· Document Number length should not exceed 20 characters.

· Transaction Date is NULL. This field is mandatory for XXXXX type transactions.

· Transaction Date 14/40/2019 is not valid.

· Amount is NULL. This field is mandatory.

· Amount 123A is not numeric.

· Location record XXXX missing from the WAREHOUSE.LOCATION file.

· Deposit Type Code record XX missing from the BANK.REC.DEP.TYPE file.

· Check XXXXXXXXXX is already matched.

· Check XXXXXXXXXX Amount XXXX.XX does not match XXXX.XX.

· Check XXXXXXXXXX does not exist for this bank.

· Transaction could not be matched.
