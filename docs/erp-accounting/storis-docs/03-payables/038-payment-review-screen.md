---
title: Payment Review Screen
article_id: 15202012593044
section: 03-payables
index: 38
url: https://storis.zendesk.com/hc/en-us/articles/15202012593044-Payment-Review-Screen
source: STORIS Help Center (storis.zendesk.com)
---

Tabs: General, Detail

Use this screen to view additional information on payments made (if any) on a selected AP bill. This option is available only if payments have been made for the AP bill. You access this screen via the Actions button on the Check Information tab in the Enter/Update Individual Vendor Invoice routine. The screen displays the date, method of payment, reference, and amount of any payments made on the bill.

NOTE: If you select the Toggle Currency option before you choose the View Payments option on the Enter/Update Individual Vendor Invoice screen, the payments display in domestic currency.

This is a read-only screen. The following is documentation for the entry version of this routine. It appears here for reference purposes only.

This screen can contain multiple payment types including

Check,

Debit Card,

Cash,

Credit Card,

Virtual credit card, and

On-Line payments

You can also use this routine to inquire on printed payments and, when called from the Check Approval process, maintenance for payments not yet printed including the following:

Specifying the approval amount

Taking discounts on bills regardless of the discount date

Splitting specific bills into separate checks

Merging bills from separate checks

Header Area

Reference ReferenceThe internal, system-generated key number for the payment displays. This number identifies the payment within the system.

Vendor VendorThe vendor associated with the payment displays.

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

Electronic Funds Transfer

Virtual Credit Card

Date DateThe payment date displays.

Amount AmountThe Payment amount displays.

Reference ReferenceThe Payment amount displays.

Status Status

One of the following statuses displays:

Completed (EFT)

Pending

Printed

Reconciled

Transmitted (EFT)

Voided

Status Date Status DateThe date of the last status change displays.

Vendor VendorThe vendor name displays.

Remit-to Remit-toThe vendor remit-to name displays.

Exchange Rate Exchange RateThe exchange rate for foreign vendors displays. This displays only for foreign vendors if the actual exchange rate was used to override AP bill exchange rates when the check was printed.

ActionsActions

General Ledger – View GL hits associated with the payment.

NOTE: This action is not available for Pending payments because the GL hits have not yet been determined.

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
