---
title: Enter a Customer Payment
article_id: 15202297408148
section: 04-receivables
index: 40
url: https://storis.zendesk.com/hc/en-us/articles/15202297408148-Enter-a-Customer-Payment
source: STORIS Help Center (storis.zendesk.com)
---

Access

Accounting > Receivables > Enter a Customer Payment

Use this program for back-office entry of cash, checks, and credit card transactions. You can post the money as:

full or partial payments to completed orders,

deposits to an existing open order,

an on-account credit receivable for future application and key-off against an open debit receivable,

full or partial payments to bad debts that have been *charged off,

installment payments due,

additional installment payments

payments to revolving MMP's due,

additional revolving payments, OR

MMP prepayments to revolving.

The Actions button provides the following options for applying the payment:

On Account

Deposit

Bad Debt

Revolving Prepayment

Additional Payments to Revolving and Installment

NOTE: You cannot post revolving deposits to open orders using this process. Instead, use the Enter a Customer Payment/Refund/Gift Certificate routine.

*You can also apply payments to charged-off accounts using Enter a Customer Payment/Refund/Gift Certificate. Use this routine if you want to print a receipt for a payment.

*If the Allow Overpayments on Charged Off Accounts setting is checked in Accounts Receivable Control Settings, you can apply payments that exceed the charged-off balances, provided you have security access via Create a User/Group Actions - Receivables Security. See also: Overpay Charged Off Accounts for more information.

If your Cash Balancing Control Settings is set to Balance By Cashier, the Access Control Window prompts for your user Initials and Password. This is to identify the user entering the payment only; no security check is performed and the Reason for Override prompt is not active.

If Revoke Same as Cash After ___ Late Fees within Installment Payment Plan Settings is enabled and a customer has surpassed the specified amount of late fees to pay off a contract, a warning message is displayed to continue.

This routine may be affected by Regional Processing restrictions. That is, you may not have access to all customers and locations.

After you enter the customer code and location below, the program displays open item transactions for the selected customer. For each transaction, the Reference, Deposit, Due Date, Amount, and Transaction Type display.

STORIS permits only one reference number at a time per customer for on-account payments. Each payment displays as a separate detail line for that reference.

After you enter payments/deposits and click on Add, the grid displays the Action code (OA = On Account, DP = Deposit, etc.), Amount Paid, Terms, and Adjustment Amount for each payment applied.

Date Date

Enter the date of the payment or deposit; today's date is the default. The date you enter must fall between today and the first day of the current accounting period. The field does not accept future dates. If you click on the Calendar icon, a calendar appears that you can use to select a date.

NOTE: To allow a user to backdate payments within an open sales month for dates that have not been closed to activity, the Backdate Payments setting in Receivables Security must be checked. If this setting is not checked, the user is required to obtain a security override by an authorized user.

Customer Code Customer Code

Enter the customer account number to which you want to post the cash application entry. Use the Search for a Customer (Customer Code Lookup) screen available from this field to search for an existing customer code.

NOTE: The customers you can access at this and other Customer fields may be restricted by Regional Processing.

Location Location

Enter the code of the location for which to post payments or deposits. The default location (if any) appears from the log-in screen. Note that this field is inactive if the Balance By field in the Cash Balancing Control Settings is set to Drawer.

If you click on the Arrow button, a list of locations available to you appears from which you can choose. Note that here and at any other Location field, the list of locations available to you may be affected by Regional Processing restrictions.

Bank Bank

The bank number specified in your Warehouse/Store Location Settings defaults here. You can click the Search button to access the Read-Only Lookup Window and choose a different bank for this transaction. The bank indicated here is used when posting the customer payments, unless an override bank has been indicated for this location and payment class via the Bank Override screen.

Payments Payments

The payment type and amount appears, if specified. To enter or edit the payment type, click on the Action button to access the Payment Summary Window. Use that screen to enter deposits for this order. Or, if you enter a valid payment type into this field, the associated payment entry screen appears into which you can enter the payment.

NOTE: Your ability to enter deposits as cash, check, third-party-financed, credit card, or gift certificate depends on various system settings.

Global Auto-Pay Global Auto-Pay

Use this option to automatically apply the payment amount to the customer's revolving receivables balance due, rather than selecting specific references to pay. Enter the payment information in the Payments field, and then check the box at this field to use the auto-pay feature. Payment validation occurs once the Global Auto-Pay button is checked. The payment must be the sum of the Standard MMP amount or more for the validation to occur.

Once you check this box, the reference grid and all other payment options are deactivated.

Auto-payments are applied to revolving items in this sequence:

oldest to newest due date

oldest to newest transaction date

lowest to highest APR

NOTE:If an error occurs when validating a payment, you must click on the Payments field extra action to return to the Payment Summary Screen and adjust accordingly.

Reference Reference

If you enter a payment type other than cash, this displays information on the payment, the content of which depends on the payment type specified. For example, the field may display any of the following:

check number

finance account number

credit card number (encrypted)

gift certificate number

Amount Amount

The total dollar amount of the money received displays.

A/R A/R

The total of all moneys applied displays. The system updates this total each time a payment is applied to an open item.

Terms Terms

The total of all discount terms applied displays. This is updated by the system each time discount terms are applied to an open item.

Adjustment Adjustment

Proof Proof

The account proof amount displays. In order to update this posting session, this amount must be zero (the Cash Application entry is in balance). It is calculated as follows:

Proof = Amount - Moneys posted

Grid Area

Reference Reference

To apply a payment to a specific open item transaction, or to use the auto-pay feature, select an open item transaction from the list displayed. The reference number and amount automatically display.

Action Action

To apply the entire payment or a portion of the payment to the selected item, select Pay. To initiate automatic payment of the oldest debits, starting with the selected line, select Auto Pay.

The program pays each debit in full until no more items remain to be paid in full. If an amount remains, you can enter a partial payment for that line item, or you can enter the remaining amount received as a deposit (on an open order) or an on-account payment.

Amount Amount

The total dollar amount due for the selected item will fill in. If a partial payment is being received for this item, enter the amount of the payment here.

Terms Terms

If the amount paid is less than the invoice amount, and the customer is eligible for a discount, a you can enter a discount amount here.

Adjustment Adjustment

If a discrepancy exists between the amount received and the amount due, you can enter the difference here to write off the amount. The program deducts the amount you enter here from the A/R amount due, but does not affect the proof amount.

NOTE: To provide the option to print a receipt at the conclusion of payments made through this routine, the Use Extended Payment Receipt field must be selected in the General tab in the Accounts Receivable Control Settings.

Actions

On Account

Deposit

Bad Debt - Use this option to post bad debt payments against the customer’s bad debt balance. If the customer's account contained revolving plans and the account has been charged off, the payment application process applies the payment amount against the completed order balances for any revolving plans. Payments are applied based upon the completed order date, oldest to newest.

Revolving Prepayment This option is available if the customer has at least one active revolving plan with a balance, and no MMP's currently due. Select this option to access the Revolving Prepayment window, where you can post revolving MMP prepayments.

Enter Additional Revolving Payments Use this option to enter an additional Revolving Receivables payment. This option is available only for customers with at least one active revolving plan with a balance and no MMP's currently due.

Enter Additional Installment Payments Use this option to enter an additional Installment payments. This option is available only for customers with at least one active installment contract and no installment payments currently due.
