---
title: Update Approved Customer Refunds
article_id: 15173468993300
section: 00-accounting
index: 9
url: https://storis.zendesk.com/hc/en-us/articles/15173468993300-Update-Approved-Customer-Refunds
source: STORIS Help Center (storis.zendesk.com)
---

(Customer Refund Maintenance)

AccessAccess

Accounting > Third Party Accounting > Payables > Update Approved Customer Refunds

Accounting > Third Party Accounting > General Ledger > Update Approved Customer Refunds

Use this routine to display open or closed Refund AP bills and change (if necessary) the location of the refund. Note that you can edit only invalid records. You can view, but not edit, open or closed records. This routine is active only if using Third-Party Accounting.

Deleting Refund AP Bills

To delete a refund, click on the Delete button. If the refund has not been transmitted to a third-party accounting package, the system deletes the refund on the STORIS side. If the refund has been transmitted to a third-party accounting package, the system responds in one of the following ways, depending on the third-party accounting package your system is using.

STORIS Accounting - STORIS deletes the refund on both the STORIS and the STORIS Accounting sides.

QuickBooks® - A message appears indicating that the refund still exists in QuickBooks. Go to the QuickBooks program and delete the refund. Then return to STORIS and run the Transfer Third-Party Accounting Information routine. The system deletes the refund from STORIS.

Generic Interface - STORIS deletes the refund on the STORIS side but relies on you to delete the refund on the Generic Interface side.

Important: If you do not manually delete the refund on the Generic Interface side, the two sides may become out-of-sync and cause significant problems.

STORIS includes the following security settings you can use to block your users from deleting transmitted AP Bills (including customer refunds):

Third-Party Accounting Control Settings - on the Generic tab.

Delete payable bills after third party accounting transmission field located in Create a User/Group Actions - Payables Security settings.

Mode/Status Mode/Status

The mode and/or status of the current process appears in the upper-right of the screen. Status indicates the condition of the AP bill - open, invalid, or closed. Mode indicates the current function of the routine - Inquiry or Maintenance.

Refund Number Refund Number

Enter a Refund AP bill number. If you click on the Search button, a menu of search options appears.

GL Post - Lists all un-transferred GL batches and the source for each.

Bad TPA Batch Lookup - Accesses the Bad TPA Posting Selection lookup, which lists all bad batches along with the source and comment for each.

TPA Batch Xref - Accesses a cross reference search for the GL batch number that is created in the STORIS AP/GL account during the TPA batch transfer. This option is available for STORIS Accounting only.

Transaction Type Transaction Type

The transaction type appears. You cannot edit this field.

Customer Customer

The customer name and number appear. You cannot edit this field.

Document Reference Document Reference

The document reference number appears. This number is drawn from the credit memo that generated this refund. You cannot edit this field.

Warehouse Location Warehouse Location

The default warehouse location for this refund appears.

Amount Amount

The amount of the refund appears. You cannot edit this field.

Account Account

The account number for this refund appears.

Message Message

If an error occurred causing the system to reject the customer refund, an error message appears describing the problem. Otherwise, this field is blank.

ActionsActions

When you click on the Actions button, a menu appears from which you have the following choices:

Document Inquiry

AP Bill Comments
