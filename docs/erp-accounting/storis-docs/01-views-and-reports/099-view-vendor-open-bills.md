---
title: View Vendor Open Bills
article_id: 15295157047444
section: 01-views-and-reports
index: 99
url: https://storis.zendesk.com/hc/en-us/articles/15295157047444-View-Vendor-Open-Bills
source: STORIS Help Center (storis.zendesk.com)
---

Access

Enter/Update Individual Vendor Invoice > Bill field > Search button > View Vendor Open Bills

Available as Dynamic Tab Settings > Type > Vendor

This routine displays detailed information on open AP bills. Use the entry fields to filter your output. Click the Filter button to search for AP bills based on your selected search criteria. Note that the Filter button is not active until you specify a filter value.

Vendor Vendor

Enter the code of the vendor whose payable activity you want to view. Click the Search button to search for a vendor via the Vendor Name Search window.

Exchange RateExchange Rate

This read-only value populates from Vendor Settings.

Currency TypeCurrency Type

This field displays the type of currency (e.g. domestic, foreign) used in this screen's calculations. This field is displayed when the global Actions button option, Toggle Currency, is used.

NOTE: If you select a refund vendor, the Invoice field changes to Customer. Additionally, in the grid, the Purchase Order column changes to Customer, and the Invoice column changes to Reference.

Company Company

Select the company for which you want to restrict this inquiry. This field is available only if multi-company possessing is active; otherwise, it is inactive. Click the Action button to choose one or more companies via the Multiple Company Selection Window. If multi-company possessing is not active, the default company appears and the field inactivates. Leave the field blank to select all companies.

Bill Type Bill Type

Select the bill type to which you want to restrict this inquiry. Click the Action button to select one or more bill types via the Multiple Bill Type Selection Window. Leave the field blank to select all bill types.

Remit To Remit To

Select the code of the vendor remit-to to which you want to restrict this inquiry. Click the Action button to select one or more vendor remit-to's via the Multiple Remit-To Selection Window. Leave the field blank to select all vendor remit-to's.

Company Company

Select the company for which you want to restrict this inquiry. This field is available only if multi-company possessing is active; otherwise, it is hidden. Click the Action button to choose one or more companies via the Multiple Company Selection Window. Leave the field blank to select all companies.

Invoice Invoice

Define the number(s) of the invoice(s) to which you want to restrict this inquiry. Click the Action button for the following options:

Search for a Customer - Opens the Search for a Customer window from which you can select a customer. This action is active only when the selected vendor is a refund vendor.

Enter Multiple Invoices - Opens the Multiple Selection Lookup Window from which you can select one or more invoices.

NOTE: This field changes from Invoice to Customer when the selected vendor is a refund vendor.

Purchase Order Purchase Order

Select the number of the purchase order to which you want to restrict this inquiry. Click the Action button to select one or more purchase orders via the View Billed Purchase Orders By Vendor. Leave the field blank to select all purchase orders.

Status to Include Status to Include

Use this field to restrict your inquiry to AP bills to one or more of the following bill statuses:

Open – Display open AP bills (or bills without a status).

Pending – Include Pending bills in the display.

Hold – Include AP bills on Hold.

Hold Code Hold Code

Select the AP hold code to which you want to restrict this inquiry. Click the Action button to choose one or more hold codes via the Multiple Hold Code Selection Window. Leave the field blank to select all codes. This field is active only if you select Hold at the Status to Include field; otherwise, it is hidden.

Grid InformationGrid Information

If you double-click on a grid item, the View AP Bills routine appears for the selected item. The following columns are available:

Invoice - The selected vendor's invoice number.

Bill - The bill identifier number.

Type - The selected bill type code.

Date - The date of the invoice.

Status - The status code of the invoice.

Purchase Order - Purchase order number associated with the invoice.

Total - The total amount of the invoice.

Open - The amount open on the invoice.

Company - The company code to which the vendor invoice is billed.

EDI

ActionsActions

Toggle Currency
