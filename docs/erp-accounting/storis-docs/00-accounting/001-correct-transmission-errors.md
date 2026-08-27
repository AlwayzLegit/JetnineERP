---
title: Correct Transmission Errors
article_id: 15173492649492
section: 00-accounting
index: 1
url: https://storis.zendesk.com/hc/en-us/articles/15173492649492-Correct-Transmission-Errors
source: STORIS Help Center (storis.zendesk.com)
---

(TPA Reject Maintenance)

AccessAccess

Accounting > Third Party Accounting > General Ledger > Correct Transmission Errors

Use this routine to fix rejected TPA transactions so you can re-transmit the items containing the errors to your third-party accounting package. This routine can fix GL transfer errors, AP transfer errors (receiving and vendor credits), and customer-refund transfer errors.

After you file your changes, the system re-evaluates the items. If the batch is still not valid, the reason appears on the screen and you can either save the batch as-is or abort the file and continue with the maintenance process.

If the batch is valid (and TPA is active), the following prompt appears:

Resubmit this item to TPA?

If you click Yes, the system removes the TPA error flag and resubmits the item to TPA.

Posting Type Posting Type

Specify the posting type. You can choose from the following:

Bill Payments - Selecting this posting type brings you to the TPA AP Bill GL Postings screen. Access the Bad TPA Batch lookup via the Search button at the Bill prompt, then select the item you want to fix from the list that appears.

Bill Credits - Selecting this posting type brings you to the TPA AP Bill GL Postings screen. Access the Bad TPA Batch lookup via the Search button at the Bill prompt, then select the item you want to fix from the list that appears.

Customer Refund - Selecting this posting type brings you to the Update Approved Customer Refunds screen. Access the Bad TPA Batch lookup via the Search button at the Refund Number prompt, then select the item you want to fix from the list that appears.

GL Batches - Selecting this posting type brings you to the Post/Update a Journal Entry screen. Access the Bad TPA Batch lookup via the Search button at the Batch prompt, then select the item you want to fix from the list that appears.

Rejected Items Found Rejected Items Found

The number of rejected items for the posting type selected at the Posting Type field displays in this field.
