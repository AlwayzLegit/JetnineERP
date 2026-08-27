---
title: Maintain Customer Deposits
article_id: 15202297406356
section: 04-receivables
index: 65
url: https://storis.zendesk.com/hc/en-us/articles/15202297406356-Maintain-Customer-Deposits
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > Receivables > Receivables Adjustments and Refunds > Maintain Customer Deposits

Accounting > Receivables > Point of Sale > Returns and Refunds > Maintain Customer Deposits

Customer > Point of Sale > Returns and Refunds > Maintain Customer Deposits

Customer > Customer Service > Returns and Refunds > Maintain Customer Deposits

NOTE: If the STORIS screen title indicates a read-only version of this routine, you cannot edit any of the fields. However, you can view all of the information available in the regular routine.

After you post a deposit to an account, the amount becomes a deposit liability. Use this program to either place on account, move, apply to gift certificates, or refund deposit moneys. The following options are available:

Move on-account money to a deposit. To refund on-account money, use the Maintain Customer Balances program.

Delete order deposit money by

moving the money to a new sales order,

placing the money on account, or

refunding the money to the customer.

Manipulate deposit money from open sales orders by

moving the money from one order to another,

placing the money on account, or

refunding the money to the customer.

Credit financed deposits to Finance Receivables. Note that this is the only option available for FR deposits. You cannot move FR deposits from one order to another. You must credit the deposits, then reapply them via the Enter a Customer Payment/Refund/Gift Certificate routine or to the order you want to apply it to.

Refund a revolving plan credit balance. An immediate refund can be issued to the customer or an AP Bill can be created to issue a check refund. Note that revolving credits are processed separately from other types of transactions processed here. The refund method can be viewed via View a Customer's Payment Activity.

Immediate refunds are issued when only one payment type contributed to the credit balance.

Check refunds are issued when multiple payments contributed to the credit balance (even if the same payment type was used), or when no payment history is found.

You are prompted to print a refund receipt if the Maintain Customer Deposits Refund Receipts in Point of Sale Control Settings is set to any option except "No Receipt". You are continued to be prompted for each receipt print. The print method depends on the option chosen. If the Refund Method is an Accounts Payable refund, a receipt does not print nor is a signature captured.

Customer refunds can be checks, cash, gift cards, or credit card deposits. You specify the refund type at the Action field.

Customer Code Customer Code

Enter the code of the customer account whose deposits you want to view. If you click on the Search button, the Search for a Customer (Customer Code Lookup) screen appears from which you can select a customer code. Once you enter the customer code, deposits posted to this account display on the screen.

NOTE: The customers you can access at this and other Customer fields may be restricted by Regional Processing.

Total Liability Total Liability

The total amount of all open deposits appears for the selected account.

Applied, Refund, On-Account, FR Credit Applied, Refund, On-Account, FR Credit

As you maintain deposits for this account, a running total of deposit money moved, refunded, or placed on account displays in the applicable fields.

Grid Area

Once you enter a customer code, deposits posted to that account display in the grid. Once you select an order, maintenance options for the order become active.

Order Order

Enter (or select from the grid) the order whose deposits you want to maintain.

If a refund is available for a revolving credit balance, the following two options are available:

I - Immediate refund is generated to the last payment type used on the revolving plan that generated the credit balance.

R - A check refund is generated. If a check refund is the only applicable refund method, this is the only option available in this field.

Action Action

Use this field to define the action you want to perform on the deposit money. In order to access these options, you must have permission via the corresponding "Maintain Customer Deposits" fields in your User/User Group Receivables Security settings.

A = Apply - apply this deposit money to an open order

R = Check Refund - *refund the deposit money to the customer in the form of a check

I = Immediate Refund - #refund the deposit via the original payment type or a gift certificate

O = On-Account - place the deposit money on account, to be adjusted at a later date

F = Finance Credit - remove the deposit and credit the amount to the customer's third-party financing account

* If the original payment was a credit card payment, the option to refund to the credit card appears.

# To issue an immediate refund, the payment type you use for the refund must be active at the Immediate Deposit Refund Types field in the Accounts Receivables Control Settings. Otherwise, you must use the Check Refund option to issue the refund in the form of a check. Also, if the current date is closed for payments (via the Actions button in the Accounts Receivable Control Settings), the program prevents you from entering an immediate refund.

NOTE: You can move deposits that are on a Service Order to on-account if the Service to Sales Deposit field is checked on the Deposits tab in your Accounts Receivables Control Settings.

Builder allowance and in-store use only gift certificates cannot be refunded, however deposits for these gift certificates can be applied to another sales order.

A card must be present to complete an independent refund for Adyen credit card processing. Once saved, this puts the money for the refund on account where you need to go through Enter a Customer Payment/Refund/Gift Certificate to issue it.

The following rules apply when maintaining deposits financed with a revolving plan:

If an order with a revolving deposit is deleted, the deposit is automatically removed and is therefore not available via this process.

You can refund revolving deposits from open orders using this process, provided the Revolving box at the Immediate Deposit Refund Types field is checked in your Accounts Receivables Control Settings.

You can NOT transfer revolving deposits from one order to another using this process.

You can NOT transfer revolving deposits to On Account using this process.

Payment TypePayment Type

This field displays the payment type (and, for credit card payment types, the last four digits of the card number) associated with the selected order. If more than one deposit has been applied to the order or if a check refund is due, "Multiple Deposits" displays at this field. If the order includes multiple credit card payments, you can view the individual payment types on the Take Multiple Deposits screen.

NOTE: Pre-authorized payments as defined in the Allow Pre-Authorizationed Deposits field of Payment Card and Device Settings are not displayed and are not available for maintenance in this routine.

Available Available

The amount of the selected deposit available to move, refund, or place on account displays.

If moving a deposit to another order or applying an on-account payment to a deposit on an order, use this field to select the order to which to apply the deposit money. If you click the Action button, the Deposit Application Screen appears via which you can choose an order.

Amount to Take Amount to Take

Enter the amount of the deposit (full or partial) you want to move, refund, or place on account.

If multiple deposits were applied to the selected order, click the Action button at this field to access the Take Multiple Deposits entry screen. Use this screen to select the deposits you want to refund and the amount you want to take from each.

For cash refunds, if a Daily Maximum Cash Refund Per Customer amount exists in Accounts Receivable Control Settings, the user is restricted to refunding that cash amount, unless provided the ability to override the maximum amount via the Override Daily Maximum Cash Refund Per Customer setting in Create a User/Group Actions - Receivables Security. If the user does not have permission to exceed the daily maximum cash refund amount, the Amount to Take must be reduced for one or more rows in the grid, or a different Refund Type can be used.

For refunds to a revolving credit plan, this field is automatically populated withe the amount and is inactive. Partial refunds are not permitted.

Refund MethodRefund Method

Specify the transaction type for the refund. The refund payment types available to you are restricted to the Immediate Deposit Refund types selected in the Accounts Receivable Control Settings.

Additionally, deposits made by credit card can only be refunded via the same credit card or by gift card; deposits made by debit card can be refunded by cash, gift, as well as that same debit card.

NOTE: If the Refund Method is an Accounts Payable refund, a receipt does not print nor is a signature captured. The ability to control printing refund receipts is via the Maintain Customer Deposits Refund Receipts in Point of Sale Control Settings.

Reason Reason

Specify the reason for this deposit adjustment, using up to 50 characters of free text.
