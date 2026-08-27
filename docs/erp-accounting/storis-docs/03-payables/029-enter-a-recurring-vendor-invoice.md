---
title: Enter a Recurring Vendor Invoice
article_id: 15202013215636
section: 03-payables
index: 29
url: https://storis.zendesk.com/hc/en-us/articles/15202013215636-Enter-a-Recurring-Vendor-Invoice
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > Payables > Enter a Recurring Vendor Invoice

Use this routine to create new recurring AP bills as well as maintain existing ones, for example for recurring AP bills such as utility bills. The End-of-Day (EOD) process examines the records in this file and generates AP bills accordingly.

GL hits for recurring AP bills occur on the day EOD creates the bill, and GL hits for adjustments occur on the day of the adjustment.

Header Area

Last Bill Created Last Bill CreatedThe date on which the last AP bill was generated displays.

Next Bill to Create Next Bill to CreateThe date on which the next AP Bill is to be generated displays.

Reference Reference

Enter the code of the recurring invoice you want to enter or edit. If entering a new record, the following fields activate:

Description

Bill Line Text

Vendor

Once you specify a vendor, the remaining fields activate.

Description DescriptionEnter or edit the description of the reference specified above.

Bill Line Text Bill Line TextEnter any text you want to use to build the AP bill line.

Vendor VendorEnter the vendor for this recurring invoice. If you click on the Search button, the Vendor Cross Reference appears from which you can select a vendor. For existing recurring invoices, the vendor appears and you cannot edit the field.

Remit To Remit ToClick the Arrow button and select the Vendor Remit-To Settings ID for the remit-to address you want to use for this bill. When you click the Arrow button, at least one remit-to record is listed. (By default, an initial remit-to record with the ID "1" was created when the vendor was created.)

If you edit or enter remit-to address records for the vendor via Vendor Settings/Vendor Remit-To Settings, and your recurring invoice has already been created, you must access the invoice and select the new remit-to address. Changes to the remit-to address that are made after the creation of the recurring invoice are not automatically updated on the invoice.

Remit Comment Remit CommentEnter the default check print comment (if any) you want to appear on the check.

Bank BankEnter the check print bank. The default bank (if any) from the Vendor Remit-To Settings appears. If you leave this field blank, the program uses the default bank from the Payables Control Settings.

Terms TermsEnter the terms code you want to use when building the AP bill. If you click on the Search button, a list of terms codes appears from which you can choose. This field is available to be set for all AP Bill Types.

GL Account GL Account

Enter the GL account to which you want to post the offset to Accounts Payable. You can click the Action button to access the Single GL Account Entry or Multiple GL Account Entry screens.

NOTE: General Ledger User Permissions apply.

To select the Multiple GL Account Entry action, a payment amount must be added to make it available. The payment amount defaults as a credit to Accounts Payable (AP). You must enter GL account numbers with debit amounts to offset the AP post. You cannot use this action if you select the Varying Amount option in the Type field.

Hold Code Hold CodeEnter the hold code (if any) you want to apply to this recurring vendor invoice. If you click on the Search button, a list of valid hold codes appears from which you can choose. Note that if you set the Payment Amount field below to zero, you must specify a hold code.

Type Type

Specify a recurring AP bill type. You have the following options:

None – Specify no recurring AP bill type.

Perpetual – Generate an AP bill for a fixed amount each month indefinitely. If you select this option, you activate the Payment Amount field below

Start/End Date - Generate an AP bill for a fixed amount each month until the specified end date. If you select this option, you activate the following fields:

o Payment Amount

o End Date

Balance Zero - Generate an AP bill for a fixed amount each month until the amount at the Total Amount field decrements to zero. If you select this option, you activate the following fields:

o Payment Amount

o Total Amount

Varying Amount – Select this option to apply a variation of the Perpetual and Start/End Date types, for example for bills such as utility and telephone, in which the amount changes based on usage. If you select this option, you must also specify a Hold Code. The program automatically assigns a Hold status to generated AP Bills, thus ensuring the bills will be reviewed and the amount changed appropriately. The program assigns the Payment Amount field an amount of zero and remains inactive. If you select this option, you activate the following field:

o End Date – You can specify an end date to the range of dates for which you want to generate AP Bills.

NOTE: The Multiple GL Account Entry action in the GL Account field is not available when you select the Varying Amount option.

Payment Amount Payment AmountEnter the monthly payment amount. If you select Varying Amount at the Type field, this field defaults to zero and inactivates.

Total Amount Total AmountEnter the total amount to pay for Balance Zero types.

Starting Date Starting DateEnter the date on which you want the system to begin considering bills for creation.

End Date End DateEnter the date on which you want the system to stop considering bills for creation. This field is active only if you select Start/End Date or Varying Amount at the Type field.

Due Day Due DayEnter the day of the month on which the recurring payment is due. Enter a value from 1 to 31. In months where the Due Day is invalid (for example, 02/31/08), the program decrements the day of the month until a valid date is found.

Balance BalanceThis field displays the open balance for Balance Zero types.
