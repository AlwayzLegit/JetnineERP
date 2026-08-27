---
title: Void EFT Batch
article_id: 15202011280788
section: 03-payables
index: 61
url: https://storis.zendesk.com/hc/en-us/articles/15202011280788-Void-EFT-Batch
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > Payables > Process Checks > Electronic Funds Transfer > Void EFT Batch

Use this routine to void a completed electronic funds transfer (EFT) batch and all its payments. The program "backs out" the payments for selected AP Bills and reverses the GL postings associated with the payment.

Bank Bank

Enter the code of the bank from which the payment you want to void was drawn. If you click on the Arrow, a list of EFT banks appears from which you can choose.

Date DateOnce you select a batch, the batch date displays here.

Time/Code Time/Code

This dynamic field displays the Batch Code for multiple payment batches, and Batch Time for a single batch payment.

EFT Batch Number EFT Batch NumberSpecify the number of the EFT batch you want to void. If you click on the Search button, the EFT Batch Lookup appears from which you can choose a batch. Note that reconciled batches are not eligible for voiding.

Amount AmountOnce you select a batch, the total batch amount displays here.

NOTE: This program allows you to void a payment in a sales overlap period.

Grid InformationGrid Information

Once you select an EFT batch, the grid populates with the payments associated with the batch, including the following information:

Reference - payment number

Remit-To

Vendor

Amount

Status

EFT Number - EFT Payment Number for the bank (similar to a check number).

If you double-click on a payment in the grid, the View Payment Screen appears for the selected item.

Once you select a batch, click the Save button. The process voids

each payment in the EFT batch and moves any AP bills that were in history to the AP.BILL file.

the EFT Batch's bank reconciliation transaction record.

For each payment, the process posts a reversing GL batch for

each payment, debiting the EFT GL account and crediting the Accounts Payable account.

the entire EFT batch, crediting the EFT GL account and debiting the AP Cash account.
