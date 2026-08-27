---
title: Installment Receivables Overview
article_id: 15202279027988
section: 04-receivables
index: 59
url: https://storis.zendesk.com/hc/en-us/articles/15202279027988-Installment-Receivables-Overview
source: STORIS Help Center (storis.zendesk.com)
---

An Installment Contract Receivable is a “closed ended” receivable, since the total amount to be paid is determined at the time of the purchase. The total interest and insurance charges are calculated up front. Monthly installment payments due are calculated when the installment plan is written, and do not change each month. The monthly payment amount includes the principal, interest, document fees, and insurance. When an order is written, the principal, insurance, and term (period during which the customer must satisfy this debt) are used to calculate the total interest amount. The total installment plan amount is posted to long-term receivables. On a monthly basis, during cycling, the monthly payment amount is moved from long-term receivables to open item accounts receivables.

Interest Calculation Methods

Straight Line

The interest, insurance, and principal amounts remain the same each month, based on the Installment payment amount. Example: The Installment contract amount is $420, with a principal amount of $300. The term is 6 months. The Installment payment amount is $70 a month. Each month the payment amount is applied (depending on rates set up) as follows: $50 on principal, $10 on insurance, and $10 on interest. If the contract is paid early, the customer pays only the remaining principal amount.

Rule of Seventy-Eights/Declining Balance

The insurance and interest amounts are “front loaded”. The insurance, interest, and principal amounts being paid are calculated from the payment amount each month over the term remaining. The insurance, interest, and principal amounts being paid are calculated based on the monthly payment amount over the term remaining. Example: The Installment contract amount is $420, with a principal amount of $300. The term is 6 months. The Installment payment amount is $70 monthly. The amount applied to the principal the first month is $34; the interest and insurance amounts are $18 each (these amounts depend on insurance and interest rates that were set up). The following month, the contract amount remaining is $350. The principal amount remaining is $266 and the term remaining is 5 months. The Installment payment amount is applied as follows: $40 on principal, $15 on interest and $15 on insurance. If the customer pays off the Installment contract before the end of the term, the customer pays the principal amount remaining, plus the insurance and interest amounts.

Moving Contracts From History to Active, Returns and Contract Cancellations

The following are situations where the system moves an installment contract from history to active status.

Manual Reinstatement (via Update Contract Status)

Customer merchandise return/contract cancellation (automatic) (Update Contract Status)

Misapplied/NSF (automatic) (via Apply NSF and Correct Misapplied Payments for misapplied or NSF payment that closed the contract)

Note the following rules regarding customer returns with contract financing.

A contract cancellation via customer return can only be completed on a one to one basis. That means that there can be no partial shipments for a completed order linked to a contract. There needs to be one contract, one invoice.

If a contract is linked to several partially completed orders, each credit is keyed off by the system to the contract when the return is released. If the return is applied to the contract in error, you can enter a reverse key-off to move the return amount in open item.

If you need to cancel the contract and there are multiple returns required due to partial completion, process the returns on account for the total. Then key-off the full on-account amount to pay off the contract via Maintain Customer Balances.

Installment Receivables Setup

General System Control Settings - The Advanced Receivables add-on module must be active on your system. This setting is used to activate both Installment Receivables and Revolving Receivables.

Installment Receivables Control Settings - Specify your installment receivables system preferences.

Installment Payment Plan Settings - Create and maintain the installment receivables payment plans that your company offers.

Sales Tax Settings - Use the Installment tab to maintain fee, late charge, and interest settings by jurisdiction.

Reason Code Settings - Associate reason usage codes with specific reason codes.

Extended Receivables Insurance Code Settings - Establish and maintain insurance plans.

Contract Balance Adjustment Settings - Enter and maintain additional installment contract adjustment types (optional).

Contract Classification Settings - Create and maintain installment contract classification codes.

General Ledger Assigned Account Settings - Specify general ledger accounts to be used when posting installment receivables.

Create a User and User Group Security Settings - Control user/user group access to installment functions.

Installment Plan Entry and Maintenance

Adjust Contract Balance

Defer Installment Payments

Forgive Late Fees

Installment Worksheet

Manage and Adjust Installment Contracts

Review Contract Details

Update Contract Status - If you cancel an installment contract, you have the option to update the Metro 2 file either manually or automatically. To update manually, access the Metro 2 Code Settings via the Action button on the Receivables tab in the Advanced Customer Settings and assign an account status to the customer. To have the file updated automatically, go to Reason Code Settings and create reasons with an associated Account Status.

Maintain Receivables

Enter a Customer Payment

Maintain Customer Balances

Enter a Customer Payment/Refund/Gift Certificate

Printing Documents

Indicate Message to Print on Customer Statements

Enter Statement Messages

Print an Installment Contract

Print a Customer's Installment Statement

Views and Reports

View a Customer's Payment Activity

View Contract Postings

View Deferred Payments

View Details of Payment Activity

View Historical Contract Rebates

View a Customer's Receivables Activity Summary

Report Installment Delinquency Statistics Summary

Report Installment Receivables Activity
