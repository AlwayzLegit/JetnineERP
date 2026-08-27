---
title: Payment Agreements Overview
article_id: 15202280008852
section: 04-receivables
index: 76
url: https://storis.zendesk.com/hc/en-us/articles/15202280008852-Payment-Agreements-Overview
source: STORIS Help Center (storis.zendesk.com)
---

Payment Agreement processing allows you to mass update revolving accounts with customer payments received from sources such as automatic payroll deductions, Social Security, the Veterans Administration, insurance companies, etc.

Setup
To use Payment Agreements, the feature must first be activated and configured across several settings. Check "Allow Payment Agreements" in Revolving Receivables Control Settings to turn the feature on system-wide (it's unchecked by default).
Each organization that remits payments — payroll, SSA, VA, an insurer, etc. — must then be set up as a source in Receivable Payment Source Settings, where you define how often that source pays per month (1, 2, or 4 times), which Miscellaneous Payment type to post its payments under, and how its payment file is delivered and processed (on demand, at End of Day, or both).
The Miscellaneous Payment type referenced there must, in turn, have "Use For Payment Agreement Import" checked in Miscellaneous Payment Settings.
Finally, only revolving plans flagged to allow payment agreements in Revolving Payment Plan Settings are eligible to be linked to a source.

After you finance and complete orders with revolving plans set to allow payment agreements, you can generate a payment report to send to the source, informing them of the payment amounts to be remitted for customers with payment agreements. You can also generate the payment file that is to be used when posting the payments to the accounts.

Customer payment information can be imported and processed on demand, via End of Day processing, or both.

Revolving plans with payment agreements cycle in the same way as regular revolving plans, with the exception of MMP generation. For payment agreement plans, 1, 2, or 4 MMPs are generated, depending on the Payments Per Month established for the source. The total MMP amount for the month is divided by the customer's number of payments per month to determine the total amount of each scheduled payment. The breakdown of principal, interest, and insurance is determined for each scheduled payment, along with the associated due date.

Payment agreement information is included in the XML file for revolving statements. In addition, data elements for Source, ID, and Payments per Month are available to be added to revolving statements using enhanced laser printing.

Payment Agreement Processing, Views, & Reports

Revolving Receivables Control Settings

Receivable Payment Source Settings

Miscellaneous Payment Settings

Revolving Payment Plan Settings

Enter a Customer's Revolving Terms & Conditions

Payment Agreement Entry

Revolving Worksheet (Full)

Generation of Payment File & Payment Agreement Report

Import Customer Payments

View a Customer's Current Revolving Activity

View a Customer's Revolving Statement

Report Aged Trial Balance
