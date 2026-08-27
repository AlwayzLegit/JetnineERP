---
title: Create Electronic Funds Transfer File
article_id: 15202011281428
section: 03-payables
index: 22
url: https://storis.zendesk.com/hc/en-us/articles/15202011281428-Create-Electronic-Funds-Transfer-File
source: STORIS Help Center (storis.zendesk.com)
---

11.0
10.8
Access

Accounting > Payables > Process Checks > Electronic Funds Transfer > Create Electronic Funds Transfer File

via the Create EFT File button on the EFT Review tab of the Select and Approve Bills for Payment routine.

Use this routine to create electronic funds transfer (EFT) files for payments approved via the Select and Approve Bills for Payment routine.

Once you specify a bank in the Bank field, the fields on the screen populate and/or activate based on the EFT status of the bank (specified in the Bank Settings).

When this process is accessed via Select and Approve Bills for Payment, the following fields default with the appropriate information and are inactive: Bank, Date, Time/Code, EFT Batch Number.

NOTE: The following EFT file formats are currently available: CIBC (Canadian Imperial Bank of Commerce), Scotia Bank (SCP15), Bank of Montreal (CPA005), NACHA, SunTrust (modified NACHA), National Bank (NATIONAL), Australian Bankers Association, Truist, and Wells Fargo.

You can use this process to create the EFT file and write it to your PC, but STORIS does not transmit anything to the bank. Your organization is responsible for transmitting the EFT file to the bank.

Bank

Select the bank for which to create an EFT file. If you click on the Arrow, a list of EFT banks appears from which you can choose. If no EFT banks exist in your system (that is, the EFT File Format field in the Bank Settings is empty for all banks in your system), an error message appears and the process aborts.

Date

Once you specify a bank at the Bank field, if a pending EFT batch exists for that bank, this field populates with data associated with that batch. If EFT files available for retransmission exist for the selected bank, this field populates once you select a file at the EFT Batch Number field.

Time/Code

This field label is dynamic and is either Time or Code. For multiple payment batches, this label is 'Code'; for a single payment, this label is 'Time'.

Time - Once you specify a bank at the Bank field, if a pending EFT batch exists for that bank, this field populates with data associated with that batch. If EFT files available for retransmission exist for the selected bank, this field populates once you select a file at the EFT Batch Number field.

Code - For multiple payment batches, the code of the payment batch appears.

Action

Specify the action to perform on the selected bank. The availability of these options depends on the status of the EFT batches for the selected bank. When this process is accessed from Select and Approve Bills for Payment, this field defaults to 'Create a New EFT File' and this field inactive.

When this process is accessed from the menu, the following applies:

Create a New EFT File - appears only if a pending EFT batch exists for the selected bank. This option is available when:

there are multiple pending and completed EFT files

there are multiple pending EFT files

there is one pending EFT file

Retransmit an Existing File - appears only if EFT files available for retransmission exist for the selected bank. This option is available when:

there are only completed EFT files

there are multiple pending and completed EFT files

there are multiple pending EFT files

there is one pending EFT file

If no options are available for the selected bank, a warning message appears and the program rejects the selected bank.

EFT Batch Number

Once you specify a bank at the Bank field, one of the following occurs at this field:

If a pending EFT batch exists for the selected bank, the batch number appears here and the field inactivates.

If EFT files available for retransmission exist for the selected bank, this field activates. Specify the file you want to retransmit or click on the Search button to view a list of files from which you can choose.

The lookup displays the following information for each existing EFT file:

Batch Number

Date

Time

Total Amount of the EFT batch.

If you double-click on a line in the grid, a menu appears with the following options:

More - accesses the View Check Status and Payment Details screen

Select - returns the batch number

File Name

Specify a name for the EFT file, using up to 25 alphanumeric characters.

Complete Payments

Specify your preference for completing payments on the selected batch. At this time, only one option is available:

Immediately - complete the payments in the selected EFT batch once the program writes the EFT file to the PC.

Payment completion updates include:

Update the payment information and open amount in the AP bills

If the open amount is zero, close the AP bill and write it to history

Update payment information in the vendor

Post GL for the payment – Debit Accounts Payable, Credit EFT GL Account

Create a single Bank Reconciliation record for the total amount of the EFT batch

Post GL for the total EFT batch – Debit EFT GL Account, Credit AP Cash Account

Email Remittance Advice

You can check this box only when the Action field is set to Create a New EFT File. Check this box to have the process send an email containing the remittance advice, for each payment in the EFT batch, to the Email Address in the Vendor Remit To Settings. The email displays the AP Bill Number, Invoice Number, Invoice Date, Payment Amount, Discount Amount, Net Amount, and Remittance Comment for each AP bill on the payment.

If you check this box, then when you click the Run button on this screen, the process checks the Email Address field for all vendor remit-to's in the EFT batch. If any are not populated, a message is displayed stating that an email cannot be sent to the specific vendor remit-to. Click OK to continue or Abort to return to the screen.

If all vendor remit-to's in the batch contain email addresses, or you clicked OK to continue at the warning message, the following occurs during processing this field checked.

The process writes the EFT file to your PC.

For each payment where the Email Address field is populated in the vendor remit-to,

The process emails the remittance advice to the vendor remit-to

If the Copy Emailed EFT Remittance Advice To field in Payables Control Settings contains an address, a copy of the remittance advice is also sent to that address

The process writes a comment to each AP bill in the payment stating "Remittance Advice for EFT payment NNN emailed to Vendor Remit To XXXX."'

NOTE: The STORIS Server Can Send Emails field on the Email Configuration tab of Notifications Control Settings must be enabled in order to send these emails.

For detail regarding the email output, see the Email Remittance Advice topic.

If an EFT file was already created, you can use the Email Remittance Advice program to email the remittance advice for an entire EFT batch or only specific payments within an EFT batch.

Send Output to

The output destination of the report displays. This field defaults to ASCII Export, but you can select NFS, in which case you need to manually enter the path and file.

Export Path

The Send Output To field defaults to ASCII Export, and this field displays the pre-set computer drive and folder location to which the system exports the report data. If you select NFS, you would need to manually write in the path and file.

Actions

Output Settings - Select the output destination for the report.

Run

To create the EFT file, click the Run button. The EFT file is created and exported to the path designated. Once the program writes the file to the PC, a prompt appears via which you can access the Report Payables Disbursement routine.
