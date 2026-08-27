---
title: View Vendor Closed Bills
article_id: 15295213072788
section: 01-views-and-reports
index: 98
url: https://storis.zendesk.com/hc/en-us/articles/15295213072788-View-Vendor-Closed-Bills
source: STORIS Help Center (storis.zendesk.com)
---

Access

Enter/Update Individual Vendor Invoice > Bill field > Search button > View Vendor Closed Bills

Available as Dynamic Tab Settings > Type > Vendor

This inquiry displays summary payable information related to a selected vendor. Use the entry fields to filter your output. Click the Filter button to search for AP bills based on your selected search criteria. Note that the Filter button is not active until you specify a filter value.

Vendor Vendor

Enter the code of the vendor whose payable activity you want to view. Click the Search button to search for a vendor via the Vendor Name Search window.

Exchange RateExchange Rate

This read-only value populates from Vendor Settings.

Currency TypeCurrency Type

This field displays the type of currency (e.g. domestic, foreign) used in this screen's calculations. This field is displayed when the global Actions button option, Toggle Currency, is used.

NOTE: If you select a refund vendor, the Invoice field changes to Customer. Additionally, in the grid, the Purchase Order column changes to Customer, and the Invoice column changes to Reference.

Company Company

Select the company for which you want to restrict this inquiry. This field is available only if multi-company possessing is active; otherwise, it is hidden. Click the Action button to choose one or more companies via the Multiple Company Selection Window. Leave the field blank to select all companies.

Bill Type Bill Type

Select the bill type to which you want to restrict this inquiry. Click the Action button to select one or more bill types via the Multiple Bill Type Selection Window. Leave the field blank to select all bill types.

Remit To Remit To

Select the code of the vendor remit-to to which you want to restrict this inquiry. Click the Action button to select one or more vendor remit-tos via the Multiple Remit-To Selection Window. Leave the field blank to select all vendor remit-tos.

Invoice Invoice

Define the number(s) of the invoice(s) to which you want to restrict this inquiry. Click the Action button for the following options:

Search for a Customer - Opens the Search for a Customer window from which you can select a customer. This action is active only when the selected vendor is a refund vendor.

Enter Multiple Invoices - Opens the Multiple Selection Lookup Window from which you can select one or more invoices.

NOTE: This field changes from Invoice to Customer when the selected vendor is a refund vendor.

Purchase Order Purchase Order

Select the number of the purchase order to which you want to restrict this inquiry. Click the Action button to select one or more purchase orders via the Multiple Purchase Order Selection Window. Leave the field blank to select all purchase orders.

Starting Date Starting Date

Enter or select the starting date in the range of dates for which you want to view vendor bills. This field defaults to one month prior to today's date.

Ending Date Ending Date

Enter or select the ending date in the range of dates for which you want to view vendor bills.

Grid InformationGrid Information

The grid populates with closed AP bills. If you double-click on a grid item, the View AP Bills routine appears for the selected item. Note that when paid with multiple checks, AP bills list multiple times.

Invoice - The selected vendor's invoice number.

Bill - The bill identifier number.

Type - The selected bill type code.

Date - The date of the invoice.

Purchase Order - Purchase order number associated with the invoice.

Payment -

Total - The total amount of the invoice.

Status - The status code of the invoice.

Closed - The amount open on the invoice.

Company - The company code to which the vendor invoice is billed.

ActionsActions

Toggle Currency
