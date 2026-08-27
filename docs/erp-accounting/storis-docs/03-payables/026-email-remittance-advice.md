---
title: Email Remittance Advice
article_id: 15202012785940
section: 03-payables
index: 26
url: https://storis.zendesk.com/hc/en-us/articles/15202012785940-Email-Remittance-Advice
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > Payables > Process Checks > Electronic Funds Transfer > Email Remittance Advice

Use this routine to email the remittance advice for an entire EFT batch or only specific payments within an EFT batch. This process is available only for completed EFT batches (i.e. EFT file has been created). To create a new EFT file with the option to email the remittance advice, use the Create Electronic Funds Transfer File process.

NOTE: The STORIS Server Can Send Emails field on the Email Configuration tab of Notifications Control Settings must be enabled in order to send these emails.

The Email Header Message for Remittance Advice, Email Sent By for Remittance Advice, and Email Subject for Remittance Advice settings in Payables Control Settings affect the output of this process.

The email generated in this process is sent to each email stored in the Other field in Vendor RemitTo Settings.

Details of Remittance Advice Email Output

The email is sent to the Email Address of the vendor remit-to for the EFT payment selected.

The subject line of the email includes the bank used for the payment or the bank's company name.

The line above the table includes the EFT Payment Number, the Remit To Name, and the payment date for the EFT payment.

Information in the body of the email is formatted in a table.

The table displays the AP Bill Number, Invoice Number, Invoice Date, Payment Amount, Discount Amount, Net Amount and Remittance Comment for each AP bill on the payment.

Text in the email is formatted as HTML or plain text, depending on the server's operating system.

BankBank

Click the Arrow button to select the bank from a list of banks that are set up for electronic funds transfer (i.e. EFT File Format field in Bank Settings is populated).

Date, TimeDate, Time

The date and time that the selected EFT batch was created display and cannot be edited.

EFT Batch NumberEFT Batch Number

Indicate the batch number containing the EFT payments for which you want to email remittance advice. If you click the Search button, you access the EFT Batch Lookup, where you can select from a list of completed EFT batches for the selected bank.

Grid Information Grid Information

When an EFT Batch Number is specified, the grid is populated with the payments in the EFT batch. The contents of this grid cannot be filtered. All rows in the grid default to un-checked in the check box column. To email the remittance advice for individual payments, check the box at the beginning of the row for the payment. To email the remittance advice for all payments in the grid, check the box at the beginning of the header row, to the left of the Details column.

For any payments that are checked in the grid, the process validates that an Email Address exists for the vendor remit-to for that payment. If any of the vendor remit-to's do not have an email address, a message is displayed stating that an email cannot be sent to that vendor remit-to. When you click OK at that message, the check box is cleared for all payments without an email address.

Details - If you click the Action button in this column, you access the Payment Inquiry screen, where you can view details about the selected payment.

EFT Number - The EFT payment number displays in this column.

Remit To - The name of the vendor remit-to for the payment displays in this column.

Vendor - This column displays the name of vendor for the payment.

Amount - The total net amount of the payment is displayed.

Status - The status (completed, voided) of the payment displays in this column.

Emailed Date - The date when the remittance advice for the payment was previously emailed to the remit-to displays here.

RunRun

When you click the Run button, the process sends an email to the Vendor Remit-To (and a copy to the address specified in Payables Control Settings if any) for each selected payment. A comment is written to each AP bill in the payment, stating that the remittance advice for EFT payment NNN was emailed to vendor remit-to XXX, where NNN=payment number and XXX=vendor remit-to ID.
