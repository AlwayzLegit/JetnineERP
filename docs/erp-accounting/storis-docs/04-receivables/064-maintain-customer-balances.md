---
title: Maintain Customer Balances
article_id: 15202312760468
section: 04-receivables
index: 64
url: https://storis.zendesk.com/hc/en-us/articles/15202312760468-Maintain-Customer-Balances
source: STORIS Help Center (storis.zendesk.com)
---
11.0
10.8
Access

Accounting > Receivables > Receivables Adjustments and Refunds > Maintain Customer Balances

Tabs: Manual Adjustments, Keyoffs, Bad Debt

Use this routine to

enter manual adjustments,

maintain existing open-item transactions,

key-off credit transactions,

reclassify past-due accounts, and

reinstate charged-off accounts.

NOTE: This routine may be affected by Regional Processing restrictions. That is, you may not have access to all customers and locations.

Date

Enter the date to which you want to post this transaction. The program does not accept future dates. The current date defaults in this field.

Customer Code

Enter the customer account number to be updated. Open item transactions for this customer will display. If you click on the Search button, you access the Search for a Customer (Customer Code Lookup), from which you can select a customer code.

NOTE: The customers you can access at this and other Customer fields may be restricted by Regional Processing.

Manual Adjustments

Use the Manual Adjustments process for back-office entry of:

additional A/R transactions reflecting manually entered invoices or customer returns.

adjustments to existing open items.

Once you enter the customer code, open item transactions display in the grid.

Total Adjustment

This is the running total amount of adjustments entered in this posting session.

Reference

This is the reference number for the manual adjustment. If entering an adjustment for an existing open item, enter (or select from the list) the reference number of the item to adjust. The selected reference number displays in this field. If posting a manual invoice or customer return, the system generates the reference number (when the extra action option is selected) if a value exists in the Next Deposit Number field in the Accounts Receivables Control Settings. If the field is blank, the Reference field must be user-defined.) The system automatically adds the prefix MP to the Reference number, regardless of whether the number is system or user-generated.

Action

This field is available for change if adjusting an existing open item transaction. Select Adjust if entering a manual adjustment. Select Maintain to modify the Terms, Memo Reference, and In Dispute fields for an existing open item transaction.

In Dispute

To place the selected open item "in dispute", check the box at this field. To remove the open item from In-Dispute status, click on the box to remove the check. Note that you cannot adjust items in dispute. That is, you must first remove the In-Dispute status from the item.

This field is active only if you select

an existing open item from the grid so that it is active on the screen, and

"Maintain" at the Action field or the open item is currently "in dispute".

Type

This field indicates the type of manual adjustment being entered. For adjustments to existing transactions, this field automatically fills in and is not available for change. The field is available for change if entering a new manual adjustment transaction. Select (09) Invoice if entering a manual invoice (debit) transaction; select (39) Memo if entering a manual credit memo.

Terms

If an existing transaction is selected, this field will automatically fill in and will only be available for change if the Action field is set to Maintain. The field will also be available for change if entering a new manual adjustment transaction. Enter or modify the terms code for this transaction. When a valid code has been entered, the system will display the Open Item Terms screen. If a discount term has been entered, the program will re-calculate and display the Due Date, Discount Dates (1 & 2), and Discount Amount (1 & 2), if applicable.

Memo Reference

This field provides for entry of miscellaneous text (up to 10 characters) to explain the reason for this adjustment. For existing transactions, the current Memo Reference will fill in and may be modified. For new manual adjustments, the default reference (MAN ADJ) will fill in, but may be modified.

Adjustment Amount

Enter the dollar amount of this adjustment. This can be a positive or negative amount, depending on the transaction Type used.

NOTE: Once you enter the Action and Amount, select Add. For the transaction line selected, the grid displays the Action (P=Pay, K=Keyoff, R=Refund, O=On Account, L=Long Term Revolving) and Amount.

To place a credit amount on account, select On Account from the Actions button.

This tab is active only if you have access via the Maintain Customer Balances; Manually Adjust an Account Balance field in the Extended Security (Receivables) settings.

Grid Information

For each transaction, the grid displays the following:

Reference

Dispute (code)

Post (date)

(transaction) Type

Description Memo Reference

A/R Amount

Adjustment

Actions

Maintain GL Postings

Keyoffs

Use the Key-off process to:

Apply credit transactions to debit transactions.

Refund credit transactions, either partially or fully.

Place credit transactions on account, either partially or fully.

Apply debit and credit open items to the Long Term balance of revolving plans.

Apply credit open items to revolving MMP's.

The grid displays open item transactions for the selected customer.

NOTE: In order to process customer refunds using this screen, you must have access via the Maintain Customer Balances - Refund field in your User/User Group Receivables Security settings.

Refund

This field displays the total dollar amount of credit transactions being refunded to this customer. The field updates for each refund you enter.

Proof

This is the account proof amount. The program automatically updates this amount as each key-off is entered. Each credit item you key off updates the Proof amount. Each invoice/debit transaction you pay deducts from the Proof amount. Note that to update the account, the proof amount must be zero.

Reference

Enter (or select from the list) the transaction line to be paid, keyed off, or refunded.

Action

Use this field to indicate the action to perform on the selected transaction. You have the following options:

Pay - pay the selected debit transaction by applying a credit transaction

Keyoff - apply the selected credit transaction to a debit transaction

Refund - refund the selected credit transaction to the customer.

Long Term Revolving - apply selected debit or credit transaction to long term revolving balance

Long Term Installment - apply selected debit/credit transaction to long term installment balance - active only if customer has an active installment contract and no installment payments currently due.

Plan

This field is active if you selected Long Term Revolving at the Action field. Use this field to specify the revolving plan to which you are applying the selected open item. Click the Arrow button to select from a list of active revolving plans. Key-off's can be posted to only one revolving plan at a time.

Amount

Enter the transaction amount for the action selected at the Action field. If entering a credit amount to be keyed off or refunded, include a minus sign in your entry.

Installment Contract

This field is active if you selected Long Term Installment at the Action field. Use this field to specify the installment contract to which you are applying the selected open item. Click the Arrow button to select from a list of active installment contracts. Key-off's can be posted to only one installment contract plan at a time.

NOTE: Once you enter the Action and Amount, select Add. For the transaction line selected, the grid displays the Action (P=Pay, K=Keyoff, R=Refund, O=On Account, L=Long Term Revolving, I=Long Term Installment) and Amount.
To place a credit amount on account, select On Account from the Actions button.

This tab is active only if you have access via the Maintain Customer Balances; Key Off a Credit/Debit Balance field in the Extended Security settings.

Grid Information

For each transaction, the grid displays the following:

Reference

Dispute

Post Date

Due Date

A/R Amount

Transaction Type

Action

Memo

Amount

Actions

On Account

Bad Debt

Use the Bad Debt process to re-classify accounts that are past due. The change in classification is always done manually. You can re-classify accounts as

Charged Off

Non-Accrual

Reinstated (that is, removed from bad debt status).

The screen displays the current and past due amounts for the selected customer, as well as the

total currently due,

Revolving Balance,

Installment Balance,

total account balance, and the

charged-off balance.

To enter payments to charged-off accounts, use the Enter a Customer Payment/Refund/Gift Certificate routine or the Enter a Customer Payment routine.

The Automatic Charge-Off process is available via the Accounts Receivable Control Settings.

This tab is active only if you have access via the Maintain Customer Balances; Charge off an Account Balance field in the Extended Security settings.

NOTE: You cannot assign an Alert Code of "CO" (charged off) or assign an automatic write-off code to accounts with active revolving plans or active installment contracts. Active plans/contracts must be cancelled first.

Alert Code

Use this field to reclassify an account's bad debt status. If you click on the Arrow button, a list of customer alert codes appears, including the following:

None Selected - reinstate an account that was previously charged off. The following prompt appears:

Reinstate the customer to current status? Yes No. To return the account to a status of current and post a manual adjustment (moving the previously zeroed out A/R balance back into the current A/R), answer Yes.

NOTE: If you use the sales tax adjustment feature (see Accounts Receivable Control Settings) and sales tax adjustments were posted when you charged off the customer's balance, you may need to make GL adjustments to the sales tax following reinstatement. These adjustments, if needed, must be entered manually.

When a charged off Revolving account is reinstated, the customer’s revolving plans are reopened with a long term balance equal to the amount that had been charged off for the plan, net any payments that were applied and repossessions processed while the plan was charged off. When a revolving plan is reinstated, it has a long term balance only and does not generate MMPs until it cycles. If you need MMP(s) due to be posted to the account immediately, you must manually post them via the Adjust Revolving Plans process.

CO (CHARGED OFF) - reduce both long and short term receivable balances to zero and remove any existing open items; prohibit all sales order and receivable processing with the exception of payment applications.

NOTE: If the Charge-Off before Non-Accrual field in the Accounts Receivable Control Settings is enabled, this option is available only if the account was previously set to NA (NON ACCRUAL) status.

The actual charge-off occurs when you click the Save button. The charged-off balance is removed from the customer account, the appropriate G/L posts are completed, and the customer's account is closed to any new activity.

Using the Sales Tax Adjustment Feature for Charge-Off's

If you use the sales tax adjustment feature (see Accounts Receivable Control Settings), the system also calculates the amount of sales tax adjustment, if applicable for the jurisdiction. The sales tax adjustment transactions are created and posted to the General Ledger (see General Ledger Assigned Account Settings) before the actual charge-off of the customer balance occurs. These sales tax adjustments are included on the Report Sales Tax.

If you use the sales tax adjustment feature AND you use a third party tax provider via the STORIS Alternate Tax Interface (ATI), the amount being charged off is sent to your tax provider (Vertex, CCH). Your provider calculates the amount of the sales tax adjustment, if applicable for the jurisdiction, and returns the tax adjustment amount to STORIS for GL posting.

NA (NON-ACCRUAL) - suspend further accumulation of interest and late fees; exclude the customer from all mailing lists (that is, automatically enable the Do Not Solicit field in Customer Settings).

NOTE: When charging off an account, if the Charge-Off before Non-Accrual field in the Accounts Receivable Control Settings is enabled, you must first set the Alert Code to NA.

Even if an account is in non-accrual status, insurance charges are still cycled.
