---
title: Void Check Run
article_id: 15202011445012
section: 03-payables
index: 60
url: https://storis.zendesk.com/hc/en-us/articles/15202011445012-Void-Check-Run
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Menu

Use this routine to void all payments in a printed check run. This routine "backs out" the payments for selected AP Bills and reverses the GL postings associated with the payment.

Check runs with a Pending status cannot be voided. A check run also cannot be voided when it contains a reconciled check or a check that has been applied to an overpaid pending bill. If the check run includes one or more checks that have already been voided, the check run can still be voided, but no updates are made for the already-voided checks.

Bank Bank

Enter the code of the bank from which the payment you want to void was drawn. If you click on the Arrow, a list of banks appears from which you can choose. The default is 'No Bank Selected'. Once populated, the Date field becomes active.

Date Date

Once you select a batch, the batch date displays here. Once this field is populated, the Time field becomes active.

Time/Code Time/Code

This dynamic field displays the Batch Code for multiple payment batches, and Batch Time for a single batch payment.

Amount Amount

Once the Bank, Date, and Time fields are populated, this display-only field is populated with the total amount of the check run. Additionally, the grid populates with all the checks in the check run.

NOTE: This program allows you to void a payment in a sales overlap period.

Grid InformationGrid Information

Once you select a payment batch, the grid populates with the payments associated with the batch, including the following information:

Check Number

Remit To

Vendor

Amount

Reference - the payment reference

If you double-click on a payment in the grid, the View Payment Screen appears for the selected item.

Once you select a batch, click the Save button. The process voids

each payment in the batch and moves any AP bills that were in history to an Open status, and

the Batch's bank reconciliation transaction record.

The process posts a reversing GL batch for each payment, debiting the AP cash account and crediting the Accounts Payable account. Additionally, the bank reconciliation transaction is voided for each payment.
