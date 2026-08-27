---
title: Virtual Card Processing
article_id: 15202011361300
section: 03-payables
index: 59
url: https://storis.zendesk.com/hc/en-us/articles/15202011361300-Virtual-Card-Processing
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Page Headings: Create Payment File, Import Response File, Import Reconciliation File, Void Payment Batch

Use this routine to manage virtual card processing. If accessed via Select and Approve Bills for Payment, all pages are inactive except Create Payment File.

This table shows how the status of a batch and its payments are updated by various actions.

Action

Batch Status

Payment Status

Comment

Use Select and Approve Bills for Payment to create batch

Pending

N/A - not created yet

Virtual Card Processing > Create Payment File

Transmitted

Transmitted

Virtual Card Processing > Import Response File

Completed

Transmitted or Voided

Payment is populated with virtual card number. GL is posted.

Virtual Card Processing > Import Reconciliation File

Completed

Completed

Payment cannot be voided

Virtual Card Processing > Void Payment Batch

Voided

Voided

NOTE: The banks available in all Bank fields in this process (on each page) are banks that have the Virtual Card File Format field in Bank Settings populated.
The response of this process depends on if multiple payment batches are permitted. Multiple payment batches are enabled via the Allow Multiple Payment Batches setting in Bank Settings.

Create Payment File

Use this page to build the payment file for a new or existing batch and write it to the user's PC. This process is assessed after bills have been approved for payment.

This page can be accessed directly via the Virtual Card Review button of the Select and Approve Bills for Payment process. When accessed this way, all fields are populated and inactive and the Action defaults to Create a New Virtual Card Payment File.

When this process is accessed from the menu, the fields are available for selection.

BankBank

Select the bank from a list of available banks. The default is 'No Bank Selected'. If no banks have been set, the following message is displayed: 'No banks are set up for Virtual Card payments.' All fields remain inactive until a bank is selected.

DateDate

This display-only field shows the date of the selected virtual card batch.

Time/CodeTime/Code

This dynamic field displays the Batch Code for multiple payment batches, and Batch Time for a single batch payment.

ActionAction

Select the type of action to take for the selected bank's virtual card batch. If no options are available for the selected bank, a message displays stating this and the selected bank is rejected.

Create a New Virtual Card Payment File - When there is a pending virtual card batch for the selected bank, this is the only available option. The Virtual Card Batch Number field defaults to the virtual card batch number for the pending virtual card batch for the selected bank.

Retransmit an Existing File - When there is an existing virtual card payment file available to be retransmitted for the selected bank, this is the only available option. Only a virtual card batch with a status of Transmitted (payment file has been created but the response file has not yet been imported) is eligible to be retransmitted.

Virtual Card Batch NumberVirtual Card Batch Number

Use this entry field to indicate the virtual card batch number currently being processed. The associated Search allows selection of a batch number. This field may be automatically populated and inactive.

File NameFile Name

Enter the file name of up to 25 alphanumeric characters for the file to be exported. This field assumes a file extension of .txt. If the selected Action is 'Create a New Virtual Card Payment File', this field is populated and inactive.

NOTE: If using Comdata, this field is always automatically populated and inactive.

Send Output ToSend Output To

This display-only field is always set to ASCII Export.

Export PathExport Path

This display-only field shows the user's default export path and file name. If the file name is updated in the File Name field, this Export Path field is automatically updated.

NOTE: If using Comdata, this field is always automatically populated and inactive.

SubmitSubmit

When this button is clicked, this process creates the payment file for the specified virtual card batch and writes it to the selected path on your PC. After writing the virtual card payment file to the PC, you are prompted run the Payables Disbursement report.

Import Response File

This page imports the response file from the user's PC and updates the payments in STORIS with the virtual card numbers, expiration date, and issue date. Once the bank has been selected and the response file path has been entered by the user, click the Import button to import the response file. This process generates an error report with the payment file errors in the returned response file as well as errors encountered while importing the response file.

NOTE: Any sensitive data, such as the full virtual card number, is handled as such.

If using Comdata, payments included in the error report are automatically voided. For each bill in the payment, a comment is written to the AP Bill comments indicating that a void has been processed. The assigned error code is 'STOR' (for STORIS); these payments cannot be voided automatically, so the user must contact Comdata directly to manually void the payments if necessary. The exception is when a payment exists in the payment file but is missing from the response file; in this case, the payment is automatically voided because it was not processed by Comdata.

BankBank

Select the bank from a list of available banks. All fields are inactive until a Bank is specified here. Once the Bank and PC Path of Response File fields have been populated, the Import button becomes active.

PC Path of Response FilePC Path of Response File

Enter the location/path on the user's PC of the import response file. This field is active once a bank is selected from the Bank field.

DateDate

Once a bank is selected from the Bank field, this field is populated with the date of the pending batch.

Time/CodeTime/Code

This dynamic field displays the Batch Code for multiple payment batches, and Batch Time for a single batch payment.

Virtual Card Batch NumberVirtual Card Batch Number

This field is active once a bank is selected from the Bank field. This field populates with the transmitted virtual card batch for the bank. The associated Search allows selection of a batch number. Only a virtual card batch with a status of Transmitted (payment file has been created but the response file not yet imported) can be selected to import the response file.

ImportImport

Click to import the response file. This button is inactive until the Bank field and PC Path of Response File field are specified.

Import Reconciliation File

This page imports the reconciliation file, updates the payments with the post date (i.e. the date the funds were transferred), and sets the status of payments to 'Completed'. All fields are inactive until the bank is specified. Once the bank has been selected and the reconciliation file path has been entered by the user, click the Import button to import the reconciliation file. This process generates an error report with the payment file errors in the reconciliation file as well as errors encountered while importing the response file. The report displays the virtual card payment number, virtual credit card number (masked), vendor remit-to code, vendor remit-to name, and the error message.

NOTE: All records in the reconciliation file belong to the same account code because they are issued at the account code level. The file may contain records from multiple payment files, which contain data based on the posting date (i.e. when the merchant settles the transaction). Since merchants process payments on different days and have different schedules for settlements, usually one payment file will not have all the data in the same reconciliation file; there usually will be data from other files as well.

BankBank

Select the bank from a list of available banks. All fields are inactive until a Bank is specified here. Once the Bank and PC Path of Reconciliation File fields have been populated, the Import button becomes active.

PC Path of Reconciliation FilePC Path of Reconciliation File

Enter the location/path on the user's PC of the import reconciliation file. This field is active once a bank is selected from the Bank field.

ImportImport

Click to import the reconciliation file. This button is inactive until the Bank field and PC Path of Response File field are specified.

Void Payment Batch

This page allows the user to void a virtual card payment batch and all its payments. This page can be used when a virtual card payment batch has been entered via Select and Approve Bills for Payment and the payment file has been created but the response file has not yet been imported (i.e. the payment batch has status of Transmitted). Only virtual card batches with a status of Transmitted or Completed are eligible to be voided. Batches with a status of Pending or Voided cannot be voided. Additionally, batches containing a payment applied to an overpaid pending bill cannot be voided.

NOTE: This process cannot be used to void a single payment. To void a single payment, use the Void Payment Screen. Once even one payment within a batch has been completed (reconciliation file has been imported), the Void Payment Screen must be used to void each payment individually.

Important! If using Comdata, the user must contact Comdata directly to void payments with Comdata PRIOR to voiding a batch or payment in STORIS. This ensures payments are eligible to be voided.

BankBank

Select the bank from a list of available banks. The default is 'No Bank Selected'. When this field is populated, the Virtual Card Batch Number field becomes active.

Virtual Card Batch NumberVirtual Card Batch Number

Enter the batch number to be voided. Batches already voided are not eligible for this field. Use the Search button to lookup a batch via the Virtual Card Batch Number Lookup.

DateDate

This display-only field shows the date of the selected virtual card batch.

Time/CodeTime/Code

This dynamic field displays the Batch Code for multiple payment batches, and Batch Time for a single batch payment.

AmountAmount

This display-only field shows the total amount of the virtual card batch.

Void Payment BatchVoid Payment Batch

When this button is selected, the void payment batch process goes through each payment in the virtual card batch and voids it. Any AP Bills in the history are reinstated with an Open status. A comment about the void is written to the AP Bill Comments.

Grid InformationGrid Information

The grid populates with a list of payments for the selected virtual card batch. Double-click a grid item to view additional information via the View Payment Screen.

Payment Number - the virtual card number (similar to a check number)

Remit To

Vendor

Amount

Status

Reference - payment reference number
