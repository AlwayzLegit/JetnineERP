---
title: Post/Update a Journal Entry
article_id: 15186352935316
section: 02-general-ledger
index: 9
url: https://storis.zendesk.com/hc/en-us/articles/15186352935316-Post-Update-a-Journal-Entry
source: STORIS Help Center (storis.zendesk.com)
---

11.0
10.8
Access

Accounting > General Ledger > Post/Update a Journal Entry

Accounting > Third Party Accounting > General Ledger > Post/Update a Journal Entry

Tabs: Header, Detail Postings

If using STORIS GL Processing, use this routine to maintain existing batches and create new GL batches. If using TPA, use this routine to fix bad batches rejected by TPA. You enter Maintenance mode and can edit the Comment field and the Account field. You can also access in Inquiry mode to view a single open or closed GL batch.

NOTE: To edit/update postings, you must have entry permissions to view the account(s) established in General Ledger User Permissions. The read-only version of this screen is called View Individual Postings.

Header Area
Batch

To create a new batch, press <Enter>. To edit an existing batch, enter a STORIS GL batch number. If you click on the Search button, the following menu of search options appears:

Bad TPA Batch Lookup - Accesses the Bad TPA Posting Selection lookup, which lists all bad batches along with the source and comment for each. Available only if TPA is active.

Suspended Postings – Lists all invalid and/or "on hold" GL batches.

Posted Batch Search - Accesses the GL Batch search engine for transmitted batches.

TPA #

If using TPA, the reference number assigned by your TPA appears.

Status/Mode

The mode status of the batch and the process mode appear.

Header

This tab displays information common to all transactions in the batch.

Company

If editing an existing batch, the company to which this batch is posted appears. If creating a new batch, enter the code of the company. If you click on the Arrow, a list of companies appears from which you can choose. If multi-company processing is active, the default company appears. You can edit the default. If multi-company processing is inactive, the default company appears but you cannot edit it.

Type

Specify the type of journal entry. This field is active only when creating a new batch. If you click on the arrow, a menu appears with the following choices:

Regular Journal Entry – This is the default value.

Reversing Journal Entry – If you select this option, final update processing automatically posts a reversing batch for the fiscal period following the period displayed at the Date field. If you select this option, the field becomes inactive and the Source changes to GLRV.

End of Year Journal Entry – If you select this option, resulting postings are for fiscal period 13 of the fiscal year displayed at the Date field. The fiscal year must be open and fiscal period 12 of that year closed. If you select this option, this field and the Company are inactivated and the associated Adjust Year field is activated. The Date field changes to reflect the selected fiscal period and the Source field changes to GLAJ.

Adjust Year

This field activates if you select End of Year Journal Entry at the Type field. If you click on the arrow, the drop-down list displays each fiscal year that qualifies for adjustment for the specified company. The system defaults the first available year.

Date

If editing an existing batch, the transaction date for this batch appears. The fiscal period displays to the right of the field. If creating a new batch, you can enter any date for which a GL period table exists as long as the date does not fall within a closed period. The current date is the default. If the date falls in a future GL period, a warning message appears but you can proceed.

Status

For existing batches, the batch status appears. For new batches, enter the batch status. You have two options, both of which you can access if you click on the Arrow:

None

Hold

Source

The GL book of source appears.

Operator

The operator code for the operator who created the batch appears.

Created

The time and date of which this batch was created appears.

References

Use these optional fields to specify references to other modules associated with this GL batch. You can specify primary and secondary reference types and numbers. The primary references are often used for documents and the secondary for customers, although this is not required.

Primary Type

Use this field to specify a primary reference type. Click on the arrow to the access following list of options:

ORH – Order/Invoice, including sales, memos, service and transfers

APB – AP Bill

POH – Purchase Order

PRO – Product

CDR – Cash Drawer

VOI – Vendor Open Item

COI – Customer Open Item

FRA – Finance Account Number

Number

This field is active only if you specify a primary reference type. Enter a coinciding number. When using the APB, ORH, POH or PRO reference types, the program attempt to validate the data entered to ensure it is on file. If the reference is found, the process continues. Otherwise, a warning message appears. Note that the remaining reference types have no verification.

Secondary Type

Use this field to specify a secondary reference type. Click on the arrow to the following list of options:

CUS – Customer

VEN – Vendor

WLO – Location

Number

This field is active only if you specify a secondary reference type. Enter a coinciding number. If the reference is found, the process continues. Otherwise, a warning message appears.

Comment

Comment text relating to the entire batch appears. If in Maintenance mode, you can edit this field. Note that if you enter Remark text on the Detail Postings tab, you cannot enter Comments on this tab, and vice-versa.

Actions

Document Inquiry

Import Batch

Detail Postings

This tab displays the actual account postings. If you are in Inquiry mode, you cannot edit data but you can select an item on the grid and view the remarks for that item in the Remark field.

Account

For TPA users, if in Inquiry mode, you cannot edit this field. If in Maintenance mode, double-click on the item in the grid you want to edit. For STORIS GL Processing users, enter the number of the account you want to enter or edit. You must specify the complete account number (that is, the root, the sub-account (if applicable), and the cost center). For existing accounts, if you click on the Search button, you access the GL Account Entry screen which you can use to specify the account by element as well as view a lookup for each element. If you click on the Action button, you access the GL Account Lookup screen.

NOTE: Duplicate GL accounts are allowed in the batch. Therefore, in order to maintain an existing detail posting, you must select it from the grid.

Remark

For TPA users, remarks for the item in the Accounts field appear here. For STORIS GL Processing users, enter or edit the remark (if any) you want to associate with the selected account.

NOTE: If you enter Remark text on this tab, you cannot enter Comments on the Header tab, and vice-versa.

If you enter a remark, the remark defaults for subsequent lines in the grid. You can edit the default remark.

Debit

For TPA users, the debit amount appears here and you cannot edit this field.

For STORIS GL Processing users, enter a debit amount. The amount must be a positive number. Note that you must enter an amount here or an amount at the Credit field.

Credit

For TPA users, the credit amount appears here and you cannot edit this field.

For STORIS GL Processing users, enter a credit amount. The amount must be a positive number. Note that you must enter an amount here or an amount at the Debit field.

Debit Total

The debit total appears here. This is a display-only field.

Credit Total

The credit total appears here. This is a display-only field.

Message

If the GL batch is invalid, a Bad Post message appears. If transmitted as part of a summary batch, a Summary Batch message appears.

Actions

Validate Batch – Select this option to perform a validation on the current batch. If invalid, the results display in a text box.
