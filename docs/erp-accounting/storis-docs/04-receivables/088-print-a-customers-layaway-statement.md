---
title: Print a Customer's Layaway Statement
article_id: 15202278503572
section: 04-receivables
index: 88
url: https://storis.zendesk.com/hc/en-us/articles/15202278503572-Print-a-Customer-s-Layaway-Statement
source: STORIS Help Center (storis.zendesk.com)
---
(Layaway Statement Print)

Access

Accounting > Receivables > Print Receivables Document > Print a Customer's Layaway Statement

Use this program to print statements for orders placed on layaway . Layaway statements print information for each customer relating to layaway orders that have a balance due. Information displayed on the statement includes

sales order number,

customer information,

sale date,

"deliver by" date,

original purchase amount,

layaway payments (deposits) received,

net balance due,

layaway payment due,

payment due date.

Depending on the setting in the Corporate Access Log-on field in the Account Statement Cycling Control Settings, and the locations listed in the Create a User (Staff) file, restrictions may apply as to which stores are available to the user when running these statements. If a value exists in the Corporate Access Log-on field in the A/R Statement Cycling Control Settings, users with this location listed at the Valid Log-on Locations field in their Staff file have unlimited access to information pertaining to all stores and warehouses. Users who do not have this location listed in the Create a User file can print statements only for the store to which they log on. If this A/R Statement Cycling Control Settings field is null, this level of security is not active. See the Help topic on the Account Statement Cycling Control Settings for more detail.

Store Store

If running this report from a store, this field defaults to the store location where the report is being run. If running this report from a corporate location, enter a store location or leave this field blank to select all locations.

Number of Days Until Money is Due Number of Days Until Money is Due

Enter the number of days from the statement (current) date that the payment is due. The date (determined by adding the number entered here to the current date) prints on the statement as the "Payment Due By" date.

For example, if the statement (current) date is 4/14/06, and 10 (days) is entered at this prompt, the "Payment Due By" date is 4/24/06.

Percent of Invoice Amount Due Percent of Invoice Amount Due

Enter the percentage (two decimal places) of the total sale amount that is due by the "Payment Due By" date. The layaway amount due is calculated using this percentage and displayed on the statement next to the "Payment Due By" date. For example, if the total sale amount is $400, and 10.00 (10%) is entered at this prompt, the layaway amount due is $40.

Number of Days Until Cancellation Number of Days Until Cancellation

Enter the number of days from the date of the sales order until the layaway is canceled. The date (determined by adding the number entered here to the sale date) prints on the statement as the "Must Deliver By" date.

The following fields give you the flexibility to process some or all of the layaway statements at one time. To print all layaway statements at the same time, enter 1 in Written Start Day and enter 31 in Written End Day. To print layaway statements for a specific day or date range, enter the appropriate day or days. Example, if the Written Start Day is 15 and the Written End Day is 15, the process prints all layaways written on the 15th of any given month. If you enter 1 and 15, the process prints all layaways written on the 1st through the 15th.

Written Start Day Written Start Day

Enter the starting day, between 1 and 31, of the layaway order statements that you want to print. Starting date must be earlier than ending date.

Written End Day Written End Day

Enter the ending day, between 1 and 31, of the layaway order statements that you want to print. Ending date must be greater than starting date.
