---
title: GL Distribution - Vendor Receivables Manual Adjustment GL Postings
article_id: 15202312509588
section: 04-receivables
index: 51
url: https://storis.zendesk.com/hc/en-us/articles/15202312509588-GL-Distribution-Vendor-Receivables-Manual-Adjustment-GL-Postings
source: STORIS Help Center (storis.zendesk.com)
---

Access

Via the Apply Payments and Maintain Vendor Receivables Balances routine on the Manual Adjustments tab, using the Actions button or clicking on Save.

Use this routine to adjust GL postings for vendor receivables. You can re-assign postings to other accounts and enter offsetting debit or credit amounts. This screen is available only if using STORIS Accounting.

NOTE: To access this screen, you must have security clearance via the Edit automated general ledger postings field in the System Security settings.

Vendor Vendor

The code of the vendor specified on the previous screen appears.

Type Type

This field will display the Transaction Type Manual Adjustment, indicating entry of a manual post transaction.

Account Account

Enter the number of the GL account to which you want to make this manual adjustment. If you click on the Action button , you access the TPA GL Account Entry screen, which you can use to help locate an existing GL account and cost center.

Remark Remark

Use this field to enter a comment about this adjustment. If you leave this field blank, the system displays in the grid line for this transaction the code of the vendor involved in the transaction.

Debit Debit

Enter the debit amount (if any) by which you want to adjust this GL posting.

Credit Credit

Enter the credit amount (if any) by which you want to adjust this GL posting.

Grid Information

The vendor receivable GL account (as defined in the General Ledger Control Settings) appears in the first row of the grid. You can select the vendor receivable row in the grid, however you can edit only the Remark field. The Manual Posting GL account (as defined in the General Ledger Control Settings) appears in the second row. You can also add additional accounts. To edit these rows, double-click on a row and edit the fields above the grid.

If an account is invalid, the grid row displays in red. When you correct the error, the system returns the row to its standard color. Note that to Save and exit out of the original routine (that is, the routine from which you accessed this screen), the Proof field must be zero (that is, the general ledger batch must be in balance).

Totals - The totals of the Debit and Credit columns appear below each column.

Proof - This field displays a running proof amount, calculated by subtracting the Total Credit from the Total Debit.

Actions

Cost Center Distribution - accesses the List Entry Window, which you can use to select a pre-defined list of GL cost centers for distribution.
