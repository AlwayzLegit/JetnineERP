---
title: View a Vendor's Payable Activity
article_id: 15295211964692
section: 01-views-and-reports
index: 77
url: https://storis.zendesk.com/hc/en-us/articles/15295211964692-View-a-Vendor-s-Payable-Activity
source: STORIS Help Center (storis.zendesk.com)
---

Access

Accounting > Payables > View a Vendor's Payable Activity

Accounting > Payables > Payables Views and Reports > View a Vendor's Payable Activity

Tabs: Summary, Open Bills, Closed Bills

This routine is a STORIS standard DTS inquiry. You can modify its contents via the Dynamic Tab Settings (DTS Setup) routine, but you cannot delete it. Since DTSs are user-defined and changeable, the descriptions in this topic may not match the DTS inquiry you see on your screen. This topic describes the DTS as it appears when you first install STORIS.

Use this inquiry to view open and closed payable activity for a selected vendor. After you specify a vendor to view, information on the vendor appears on the screen. Click on the other tabs to view additional information. This routine includes separate tabs for various document types. Each tab includes a grid whose columns are specific to the type of document.

NOTE: If you select the special RFND vendor, some fields are inactive and some columns in the grid function differently. See the field and grid documentation below.

Vendor VendorEnter the code of the vendor whose payable activity you want to view. If you click on the Search button, the Vendor Name Search appears.

Summary

This tab displays a summary of payable information related to the selected vendor.

Aging Method Aging Method

One of the following bill aging methods appears. The bill aging method is specified in the Payables Control Settings.

Invoice Due Date

Discount Terms Date

Anticipated Payment Date

Age AgeThis field displays six aging periods, each of whose duration is determined by the Bill Aging Days field in the Payables Control Settings.

Amount AmountThese 6 fields display amounts based on their corresponding Age field labels. Each displays the total open amount for their aging period.

Total on Hold Total on HoldThe total open amount of all AP bills with a Hold status displays.

Total Pending Total PendingThe total amount of all AP bills with a Pending status displays.

Calendar YTD Dollars Calendar YTD DollarsThe year-to-date total dollars paid to this Vendor displays. The system uses the calendar total as opposed to fiscal year total because 1099 amounts are calendar-based.

Previous Year Dollars Previous Year DollarsThe total dollars paid to the Vendor in the prior calendar year displays.

Exchange Rate Exchange RateThe domestic exchange rate appears. To display the exchange rate for non-U.S. vendors, click on the Currency Toggle option on the Actions button.

ActionsActions

Toggle Currency

Open Bills

This tab displays detailed information on open AP bills. The grid display is listed in (AP) Bill number order. Use the entry fields to filter your output. Click on the Filter button to search for AP bills based on your selected search criteria. Note that the Filter button is not active until you specify a filter value.

Status to Include Status to Include

Use this field to restrict your inquiry to AP bills to one or more of the following bill statuses:

Open – Display open AP bills (or bills without a status).

Pending – Include Pending bills in the display. If you select the special RFND vendor at the Vendor field, this option is not available.

Hold – Include AP bills on Hold.

Hold Code Hold CodeEnter the hold code to which you want to restrict this inquiry. If you click on the Arrow, a list of Hold codes appears from which you can choose. If you click on the Action button, the Multiple Hold Code Selection Window appears from which you can choose one or more Hold codes. If you leave the field blank, you select all codes.

This field is active only if you select Hold at the Status to Include field.

Company CompanyEnter the company to which you want to restrict this inquiry. This field is active only if multi-company possessing is active. If multi-company possessing is active, you can click on the Arrow to display a list of companies from which you can choose. If you click on the Action button, the Multiple Company Selection Window appears from which you can choose one or more companies. If multi-company possessing is not active, the default company appears and the field inactivates. If you leave the field blank, you select all companies.

Bill Type Bill TypeEnter the bill type to which you want to restrict this inquiry. If you click on the Arrow, a list of bill types appears from which you can choose. If you click on the Action button, the Multiple Bill Type Selection Window appears from which you can choose one or more bill types. If you leave the field blank, you select all bill types.

If you select the special RFND vendor at the Vendor field, this field is not available.

Remit To Remit ToEnter the code of the vendor remit-to to which you want to restrict this inquiry. If you click on the Arrow, a list of vendor remit-to's appears from which you can choose. If you click on the Action button, the Multiple Remit-To Selection Window appears from which you can choose one or more vendor remit-to's. If you leave the field blank, you select all vendor remit-to's.

If you select the special RFND vendor at the Vendor field, this field is not available.

Purchase Order Purchase OrderUse this field to restrict this inquiry to one or more purchase orders for the selected vendor. If you click on the Action button, the View Billed Purchase Orders By Vendor routine appears from which you can choose one or more purchase orders. If you leave the field blank, you select all purchase orders.

If you select the special RFND vendor at the Vendor field, this field is not available.

Invoice/Customer Invoice/Customer

Use this field to restrict this inquiry to one or more invoices. Or, if you select the RFND vendor, you can restrict the inquiry to a specific customer. If you leave the field blank, you select all invoices/customers. If you click on the Action button, a menu with the following options appears:

Customer Lookup - active only for the RFND vendor

Enter Multiple Invoices - active for all vendors except the refund vendor

FilterFilter

Click on this button to display in the grid the AP bills found based on your selected search criteria. Note that this button is not active until you specify a filter value.

Grid InformationGrid Information

When you click on the Filter button, the grid populates with open AP bills found based on your search criteria. If you double-click on a grid item, the View AP Bills routine appears for the selected item. Note that when paid with multiple payments, AP bills list multiple times.

Invoice/Reference - the invoice number or, if you select the RFND vendor, the reference associated with the refund.

Bill - the bill number.

Type - the AP bill type.

Date - the vendor invoice date.

Status - The AP bill status:

- Null – None (open)

- H - Hold

- P - Pending

- C - Closed

- D - Deleted (closed only)

PO Number/Customer - the purchase order number or, if you select the RFND vendor, the customer name.

Payment - the reference number for the payment. For example, for a check payment this could be a check number entered either manually or automatically via a check run.

Total - the total amount of the payment. For voided payments, "Voided" appears in this column.

Open - the date on which the payment was opened.

Cpy - the company number.

EDI - displays "Yes" for bills created automatically via EDI.

NOTE: If you select the special RFND vendor at the Vendor field, the

- Purchase Order column changes to the Customer column and displays the customer name (appended by the customer code) for the bill. Also, the

- Invoice column changes to the Reference column, and displays the reference associated with the refund.

ActionsActions

Toggle Currency

Closed Bills

This tab displays summary payable information related to the selected vendor. The grid display is listed in (AP) Bill number order. Use the entry fields to filter your output. Click on the Filter button to search for AP bills based on your selected search criteria. Note that the Filter button is not active until you specify a filter value.

Company CompanyEnter the company whose you want to restrict this inquiry to. This field is active only if multi-company possessing is active. If multi-company possessing is active, you can click on the Arrow to display a list of companies from which you can choose. If you click on the Action button, the Multiple Company Selection Window appears from which you can choose one or more companies. If multi-company possessing is not active, the default company appears and the field inactivates. If you leave the field blank, you select all companies.

Bill Type Bill TypeEnter the bill type to which you want to restrict this inquiry. If you click on the Arrow, a list of bill types appears from which you can choose. If you click on the Action button, the Multiple Bill Type Selection Window appears from which you can choose one or more bill types. If you leave the field blank, you select all bill types.

If you select the special RFND vendor at the Vendor field, this field is not available.

Remit To Remit ToEnter the code of the vendor remit-to to which you want to restrict this inquiry. If you click on the Arrow, a list of vendor remit-to's appears from which you can choose. If you click on the Action button, the Multiple Remit-To Selection Window appears from which you can choose one or more vendor remit-to's. If you leave the field blank, you select all vendor remit-to's.

If you select the special RFND vendor at the Vendor field, this field is not available.

Invoice/Customer Invoice/CustomerUse this field to restrict this inquiry to one or more invoices. Or, if you selected the RFND vendor, you can restrict the inquiry to a specific customer. If you leave the field blank, you select all invoices/customers. If you click on the Action button and select Enter Multiple Invoices, you access the Multiple Invoice Entry screen, which you can use to select more than one invoice. When inquiring on the RFND vendor, the Action button offers the Customer Lookup option, which provides access to the Search for a Customer screen.

Purchase Order Purchase OrderUse this field to restrict this inquiry to one or more purchase orders for the selected vendor. If you click on the Action button, the View Billed Purchase Orders By Vendor routine appears from which you can choose one or more purchase orders. If you leave the field blank, you do not restrict your inquiry to selected purchase orders.

If you select the special RFND vendor at the Vendor field, this field is not available.

Starting Date Starting DateEnter the starting date in the range of dates for which you want to view vendor bills. A date of 30 days previous defaults, but you can override this date. Note that entering a large a time frame in this routine may increase the grid-load time.

Ending Date Ending DateEnter the ending date in the range of dates for which you want to view vendor bills.

FilterFilter

Click on this button to display in the grid the AP bills found based on your selected search criteria. Note that this button is not active until you specify one or more search criteria.

Grid InformationGrid Information

When you click on the Filter button, the grid populates with closed AP bills found based on your search criteria. If you double-click on a grid item, the View AP Bills routine appears for the selected item. Note that when paid with multiple payments, AP bills list multiple times.

Invoice/Reference - the invoice number or, if you select the RFND vendor, the reference associated with the refund.

Bill - the bill number.

Type - the AP bill type.

Date - the vendor invoice date.

PO Number/Customer - the purchase order number or, if you select the RFND vendor, the customer name.

Payment - the reference number for the payment. For example, for a check payment this could be a check number entered either manually or automatically via a check run.

Total - the total amount of the payment. For voided payments, "Voided" appears in this column.

Closed - the date on which the payment was paid and closed.

Cpy - the company number.

NOTE: If you enter the special if you select the RFND vendor at the Vendor field, the

- PO Number column changes to the Customer column and displays the customer name (appended by the customer code) for the bill. Also, the

- Invoice column changes to the Reference column, and displays the reference associated with the refund.

ActionsActions

Toggle Currency
