---
title: Apply NSF and Correct Misapplied Payments
article_id: 15202312760852
section: 04-receivables
index: 7
url: https://storis.zendesk.com/hc/en-us/articles/15202312760852-Apply-NSF-and-Correct-Misapplied-Payments
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > Receivables > Receivables Adjustments and Refunds > Apply NSF and Correct Misapplied Payments

Use this program to reverse two types of payments:

returned checks due to non-sufficient funds ( NSF ) - If your bank returns a customer’s check due to insufficient funds, you can enter an NSF payment adjustment to reverse the payment as well as charge a bank fee to the customer for the returned check. These reversals are based on the information recorded in the initial cash transaction. If you cannot find the transaction on the system, you can enter a manual Misapplied/NSF payment adjustment.

payments that were posted to an account in error - If you post a payment to an account in error, you can enter a misapplied payment adjustment to reverse the payment on the account where the error was made. To adjust the correct account, use the Enter a Customer Payment routine.

NOTE: If electronic check authorization (ECA) is active on your system, you cannot use this process for electronically processed check payments.

If an installment contract or revolving plan was paid off as a result of a misapplied payment, that installment contract or revolving plan is reinstated after the misapplied payment is adjusted using this process.

Misapplied online credit/debit card payments may be reversed using this process. A credit card is considered online if the Credit Card Gateway, EMV Shift-4, or Tender Retail are active on your system, regardless of if they are turned on at your specific store location.

The payment being misapplied is reopened by posting a misapplied adjustment credit to the closed payment.
Because there is no interaction with external credit/debit processing, the credit/debit card is not refunded.
A manual post is created for the misapplied online credit/debit payment that can then be applied to the proper payment due or adjusted off the account.

Builder allowance, in-store use only gift certificates, and customer reward gift certificates cannot be misapplied, to remove these deposits delete the sales order or replenish the gift certificate using Enter a Customer Payment/Refund/Gift Certificate with a negative value.

Customer Code Customer Code

Enter the account number of the customer whose payments you want to adjustment. If you click on the Search button, the Search for a Customer screen appears from which you can select a customer code. Once you specify a valid customer code, payments (including deposits and on account) posted to the account display on the screen.

NOTE: The customers you can access at this and other Customer fields may be restricted by Regional Processing.

Reference Reference

Select the reference number of the payment you want to adjust by double-clicking on that specific row in the grid.

Payment Date Payment Date

The date of the original payment displays.

Received by Store Received by Store

The store location of the original payment displays.

NOTE: At this and any other Location field, the locations you see (that is, the list of locations available to you) may be affected by Regional Processing restrictions.

Payment Type Payment Type

The payment type of the original payment displays.

Payment Amount Payment Amount

The payment amount of the original payment displays.

Transaction Date Transaction Date

The current date defaults as the transaction date for the payment reversal, but you can change the date. The date must be in an open sales period. In addition to the open sales period check, this process also checks the number of days in the Accounts Receivable Control Settings field Days to Limit Backdating during NSF/Misapply. If you enter a transaction date that is earlier than the current date minus the number of days in the control settings field, a message displays, saying: "NSF/Misapplied payment corrections can only be backdated by NN days" and your entry is rejected. If you left the control setting blank, any backdate is acceptable, provided the date is in an open sales period.

Reason Reason

The adjustment type displays. You have the following options:

Misapplied - the transaction is a reversal of a misapplied payment (that is, a payment posted incorrectly to an account).

NSF - the transaction is due to insufficient funds.

When this field is active, you can select either option. When this field is inactive, the default is set to misapplied. In order to apply NSF to a miscellaneous payment type, the payment type code in Miscellaneous Payment Settings must have the Allow to NSF field checked.

NSF Check Charge NSF Check Charge

This is the amount being charged to the customer as a result of a returned check. This field is automatically completed based on the NSF Check Fee field in the Sales Tax Settings. If a payment is being reversed manually, this information needs to be entered.

If the returned check was used to make a revolving payment and a revolving master plan has been specified for the customer, the NSF check charge is applied to the master plan in revolving receivables. If no master plan is present, or the check was used to pay an order not financed via revolving, the fee is posted to open item receivables.

Once the information for an adjustment has been completed, select Add to process the misapplied/NSF adjustment. The Misapplied / NSF Payment Results screen appears.
