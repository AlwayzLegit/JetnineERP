---
title: GL Distribution Screen
article_id: 15202277334932
section: 04-receivables
index: 52
url: https://storis.zendesk.com/hc/en-us/articles/15202277334932-GL-Distribution-Screen
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Via the Maintain Customer Balances routine, by either clicking on the Actions button or clicking on Save.

Via the Actions button in the Enter/Update Individual Vendor Invoice routine, or when filing an AP bill.

Use this routine to modify auto-generated GL postings. You can re-assign postings to other accounts and enter offsetting debit or credit amounts. This screen is available only if using STORIS Accounting.

Summary postings from the AP Bill header are available for maintenance. Note that although maintenance of foreign currency bills is always in the foreign currency, GL is presented for maintenance in domestic currency.

The read-only version of this screen is available only if using STORIS AP Processing. You cannot edit any data, only view the contents of the grid.

NOTE: To access this screen, you must have security clearance via the Edit automated general ledger postings field in the Extended Security settings.

Once you initially file out of an AP bill, if you re-access that AP bill, this screen displays only changes from the current session. To access the original GL batch, use the Post/Update a Journal Entry routine. If the batch has already been posted and you want to adjust an incorrect posting, you must create a new journal entry.

This screen appears if a posting via Maintain Financed Balances is either a manual post item or an adjustment. It appears for each adjustment made. Any changes to the GL batch must be valid or you cannot save out of this screen; you also cannot save out of this screen if the GL batch contains the $$$$$-NN default account number.

Customer Customer

The code of the customer specified on the previous screen appears.

Type Type

The transaction type of the source of the GL batch that is being created appears.

Account Account

Enter the number of the GL account to which you want to reassign this GL posting. If you click on the Action button , you access the TPA GL Account Entry screen, which you can use to help locate an existing GL account and cost center.

Remark Remark

Use this field to enter a comment about this transaction. If you leave this field blank, the system displays in the grid line for this transaction the code of the customer involved in the transaction.

Debit Debit

Enter the debit amount (if any) by which you want to adjust this GL posting.

Credit Credit

Enter the credit amount (if any) by which you want to adjust this GL posting.

Grid InformationGrid Information

The Accounts Receivable GL account (as defined in the General Ledger Control Settings) appears in the first row of the grid. You can select the accounts receivable row in the grid, however you can edit only the Remark field. The Manual Posting GL account (as defined in the General Ledger Control Settings) appears in the second row. You can also add additional accounts. To edit these rows, double-click on a row and edit the fields above the grid.

If an account is invalid, the grid row displays in red. When you correct the error, the system returns the row to its standard color. Note that to Save and exit out of the original routine (that is, the routine from which you accessed this screen), the Proof field must be zero (that is, the general ledger batch must be in balance).

Totals - The totals of the Debit and Credit columns appear below each column.

Proof - This field displays a running proof amount, calculated by subtracting the Total Credit from the Total Debit.

ActionsActions

Cost Center Distribution - accesses the List Entry Window, which you can use to select a pre-defined list of GL cost centers for distribution.
