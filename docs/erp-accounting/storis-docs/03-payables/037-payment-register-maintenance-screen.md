---
title: Payment Register Maintenance Screen
article_id: 15202012593172
section: 03-payables
index: 37
url: https://storis.zendesk.com/hc/en-us/articles/15202012593172-Payment-Register-Maintenance-Screen
source: STORIS Help Center (storis.zendesk.com)
---

Tabs: General, Detail

If you double-click on a grid item on the Check Review tab of the Select and Approve Bills for Payment routine, you access the Payment Register Maintenance process. If the check run has a Pending status, you can modify the following:

AP Bills – Edit the list of AP Bills you want to include in the check (both payments and credits). The system creates a new, separate check for any AP bills removed from the check being maintained. Any AP bills added to the check being maintained are removed from any other check on the same check run.

Discount Amount – Use the Take Override field to apply or reject the discount amount (if any), regardless of the specified terms date.

Approval Amount – You can decrease the approval amount to any amount greater than the specified discount amount, as long as the entry is greater than zero. You can also increase the approval amount to any amount up to the amount due less the discount amount. If this amount results in a partial payment, a warning message appears but you can proceed.

This screen can contain multiple payment types including

Check,

Debit Card,

Cash,

Credit Card, and

On-Line payments.

You can also use this routine to inquire on printed payments and, when called from the Check Approval process, maintenance for payments not yet printed including the following:

Specifying the approval amount

Taking discounts on bills regardless of the discount date

Splitting specific bills into separate checks

Merging bills from separate checks

Header Area

The following fields display on both tabs in this routine.

Reference ReferenceA reference number for the selected payment appears. The reference number is drawn from the grid on the Check Review tab on the Select and Approve Bills for Payment routine.

Vendor VendorThe vendor name displays.

General

The General tab contains the following display-only fields:

Bank BankThe bank name displays.

Method Method

One of the following payment methods displays:

Check

Debit Card

Cash

Credit Card

On-Line banking

Date DateThe payment date displays.

Amount AmountThe payment amount displays.

Status Status

One of the following displays:

Pending

Printed

Reconciled

Voided

Status Date Status DateThe date of the last status change displays.

Remit-to Remit-toThe vendor remit-to name displays.

Exchange Rate Exchange RateThe exchange rate for foreign vendors displays. This displays only for foreign vendors if the actual exchange rate was used to override AP bill exchange rates when the check was printed.

ActionsActions

General Ledger – View GL hits associated with the payment.

NOTE: This action is not available for Pending payments because the GL hits will not yet have been determined.

Detail

This tab displays a grid of AP bills included in the payment, as well as the following fields:

Bill BillSelect the bill you want to view or edit. You can double-click on a grid item, or you can click on the arrow to view a list of all bills on the check run that qualify to be added to the payment (check) displayed. This includes the bills already assigned to the payment as well as bills assigned to other payments, or bills that share the same remit-to. If you select a bill not assigned to the current payment, you remove the bill from the payment to which it is currently assigned and you assign the bill to the current payment.

Type TypeA full description of the AP bill type displays.

Open Amount Open AmountThe total amount available for approval displays.

Discount DiscountThe available discount amount displays for bills that have not been partially paid, and therefore are available to take the discount.

Terms Date Terms DateIf a discount displays, the terms date displays here.

Take Discount Take DiscountTo take the discount displayed regardless of whether or not the payment date falls within the discount period, check the box. This field is active only if the payment date is past the discount period (Terms Date).

Approved ApprovedThe actual amount to be paid (approved) displays.

Discount DiscountThe approved discount amount of the bill displays.

Balance Due Balance DueThe balance due after the approved amount is paid displays.

NOTE: You can use this process to create separate checks for the vendor when you access via the Select and Approve Bills for Payment process for a pending check run. By selecting a single bill and pressing the Remove button, you generate a separate check when you Save and return to the Check Review tab of the Select and Approve Bills for Payment process. The program combines all bills removed in the session into a single separate check. Likewise, you can merge bills that have been split for separate checks into the current check.

Grid InformationGrid Information

The grid contains the following columns. Note that all amounts are signed.

Bill – The AP Bill key.

Bill Type – The type of AP Bill (short description).

Terms – Terms code

Take Discount – Yes/No display of whether discount was taken regardless of terms date.

Open Amount – Total bill opened amount

Discount – Discount amount approved

Approved – Actual amount to be paid (approved).
