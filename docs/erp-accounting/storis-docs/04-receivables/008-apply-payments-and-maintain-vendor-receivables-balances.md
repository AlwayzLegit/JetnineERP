---
title: Apply Payments and Maintain Vendor Receivables Balances
article_id: 15202312646932
section: 04-receivables
index: 8
url: https://storis.zendesk.com/hc/en-us/articles/15202312646932-Apply-Payments-and-Maintain-Vendor-Receivables-Balances
source: STORIS Help Center (storis.zendesk.com)
---

(Receivables Maintenance)

Access

Accounting > Vendor Receivables > Apply Payments and Maintain Vendor Receivables Balances

Tabs: Cash Application, Manual Adjustments, Apply On-Account

Use this program to

post payments and adjustments to vendor receivables items,

post on-account payments,

place vendor receivable items in dispute,

post manual adjustments (debit and credit), and

apply on-account payments.

Date Date

Today's date will default. Another transaction date may be selected from the drop-down calendar, provided it is not in the future.

Vendor Vendor

Enter the code of the vendor to which this money will be applied. All open receivable items for this vendor will be displayed in the grid.

Applied Amount Applied Amount

This field will display the net dollar amount of adjustments applied in this session.

Cash Application

Bank Bank

Enter the code of the Bank that will receive this cash/check deposit.

Deposit Number Deposit Number

The monies posted during this transaction are part of a cash deposit batch. The system assigns the deposit batch number based on the Next Deposit Number field in the Vendor Receivables Control Settings.

Deposit Amount Deposit Amount

Enter the total amount of the cash/check deposit.

Document Document

Enter the check number of the payment that will be applied to the vendor's open items.

Comment Comment

This field is mandatory. Text entered here is used to provide additional information about the transaction. Up to 30 alphanumeric characters may be entered. This text prints on Report Daily Vendor Receivables Activity (Daily Receipts and Adjustments).

Proof Amount Proof Amount

The proof amount will indicate the difference between the Deposit Amount and the applied Amount(s) entered so far. The proof amount must be zero (0) in order to update the cash application transaction.

Reference Reference

To apply money to an item listed in the grid, double-click the transaction line in the grid. The Reference number of the selected item will display. To post an on account payment, click the Action button at this field. The Next Reference Number will be assigned.

Amount Amount

Enter the dollar amount to be applied to the selected reference or to be placed on account. Dollar amounts may be entered as positive or negative figures.

Action Action

This field allows you to apply payments against multiple documents simultaneously. You have two options: Pay and Auto-Pay. The Pay option will be selected by default, and the functionality remains the same. If Auto-Pay is selected, choose an open item transaction from the list displayed. The program pays each debit in full until no more items remain to be paid. If an amount remains, you can enter a partial payment for that line item, or you can enter the remaining amount received as a deposit (on an open order) or an on-account payment.

Dispute Dispute

Place a checkmark in the box at this field to place the selected receivable item in dispute, or remove the checkmark at this field to remove the dispute status from the selected item. Before payments may be applied to disputed items, the dispute status must be removed.

Comment Comment

The text entered in the previous Comment field will display and may not be changed.

When finished entering the payment to be applied, or following a change in the dispute status of an item, click the Add button to add the transaction to the batch. The grid displays the Adjustment amount, updated V/R Activity amount, or new dispute status, where applicable. Additional payments may be applied in the same manner. When finished entering payments for this deposit, click the Save button at the bottom of the screen to update the entries.

Manual Adjustments

Company Company

If not using multi-company processing, the company number will default in this field and will not be available for change. If set for multi-company processing, the Default Company Number will display from the General System Control Settings. You may click the Search button at this field to select from a list of valid company number codes.

Reference Reference

Click the Action button at this field to assign a reference number to a new manual posting entry, or select an item from the grid to enter an adjustment for that item. Once an item in the grid has been selected, a separate Vendor Receivables entry window will display. Click here for detail.

Due Date Due Date

Select a due date from the drop-down calendar or click the Action button to have the system fill in the due date based on the VR Terms Code established in the Vendor record.

Memo Memo

When posting a manual adjustment to a selected reference number, "Manual Post" displays in this field.

Type Type

This field will display the Transaction Type MAN, indicating entry of a manual post transaction.

Comment Comment

Text may be entered in this field to indicate the reason for this manual posting entry.

Amount Amount

Enter the amount of the manual post. You can enter a positive or negative amount. If converting the item to a payable transaction, the amount you enter must be a negative amount.

Dispute Dispute

Check this field to place the item in dispute status or remove the check mark to take the item out of dispute.

Convert to Payable Convert to Payable

If the vendor has issued a credit to be used on the next invoice, you may check the box at this field to convert the receivable item to a debit that will reduce the balance payable to the vendor.

Actions

Maintain GL Postings

NOTE: The Maintain GL Postings action will always be active while the user is processing on this tab, provided that the user has the proper security privileges to access it. However, the action will prevent user access via a popup warning message in the following scenarios:

No adjustment has yet been made.

A specific line item has been selected.

The user does not have access to the GL accounts used as the defaults during posting as defined in the General Ledger User Permissions.

Apply On-Account

Company Company

If not using multi-company processing, the company number defaults in this field and you cannot edit it. If set for multi-company processing, the Default Company Number displays from the General System Control Settings. You may click the Search button at this field to select from a list of valid company number codes.

Reference Reference

To apply an on account payment to an open vendor receivable, select a payment line from the grid. The Vendor Receivables Payment On Account Adjustments window will display. Click here for detail.
