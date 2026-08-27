---
title: Enter Multiple Vendor Invoices
article_id: 15202028504596
section: 03-payables
index: 30
url: https://storis.zendesk.com/hc/en-us/articles/15202028504596-Enter-Multiple-Vendor-Invoices
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > Payables > Enter Multiple Vendor Invoices

Accounting > Third Party Accounting > Payables > Enter Multiple Vendor Invoices

Use this process to prepare data and other information for integration into your accounting system or third-party accounting (TPA) provider (for example, QuickBooks®). After you receive a bill (invoice) from a vendor, use this process to approve the bill for payment as well as verify and modify receiving information. After approval is complete, the posted records are then ready for payment (or transmission to your third-party accounting provider if using TPA - see Transfer Third-Party Accounting Information for detail.)

NOTE: To create expense bills for items not associated with a purchase order, use the Enter/Update Individual Vendor Invoice routine.

Purchase orders do not need to be on file for you to approve and/or maintain them in this routine. That is, even if you accidentally purge a PO before it has been paid, you can still access the pertinent information using this routine. However, you cannot use the number of a purged PO as selection criteria in this routine.

Use this process for the following types of approvals:

To approve vendor invoices for inventory items, select Inventory Activity (the program selects items from the receipts record) at the Select Process Desired field and Vendor Invoice at the Type of Document field.

To approve invoices for supplies (that is, received items not for resale such as office supplies), select Miscellaneous Supplies at the Select Process Desired field. The Type of Document field then becomes inactive. If the "RECEIVING – Supply Purchase Orders must be Received" setting is enabled in Purchasing Control Settings and the supply order is received via Receive a Purchase Order, the AP bill process defaults to the quantity received.

To approve credits from vendors for returned goods, select Inventory Activity at the Select Process Desired field and Vendor Credit (the program selects items from returns records) at the Type of Document field.

To approve invoices for COM orders, select COM Activity at the Select Process Desired field. The Type of Document field then becomes inactive.

NOTE: (TPA only) If the purchase order for supplies was created in STORIS, you must complete this AP approval process in order to close the purchase order. Otherwise, supplies may be ordered and paid for using only QuickBooks.

Step 1 of 3

This process involves 3 steps. In Step 1, you specify selection criteria at the following fields. The system uses the criteria to narrow the search for items to approve or delete.

Select Process Desired Select Process Desired

Select the desired process. Choose from the following.

To search for:

Select:

items that have been received but not yet approved for payment,

New Inventory Activity

special-order, non-inventory items including service labor,

Special Order Non-Inventory

open COM purchase orders,

COM Activity

non-inventory purchase orders,

Miscellaneous (Supplies)

open purchase orders in order to convert them to pending AP bills,

Pending Merchandise Receipt

create AP Bills for payables due to and from 3rd party protection plan providers

Protection Plans

If you select Pending Merchandise Receipt, the Type of Document field forces the Vendor Invoice option and the Reference Number field inactivates. Like regular bills, you can specify any number of pending bills for a single purchase order. You can convert any of these as long as the merchandise is available.

Purchase Order Number Purchase Order NumberEnter a specific purchase order number for AP approval, click on the Action button to enter multiple purchase orders, or leave this field blank to select all purchase orders.

Auto Select Auto SelectWhen you indicate one or more purchase orders at the Purchase Order Number field, this field becomes active. If you are approving all items (for payment) on the purchase order(s) you indicated, you can check the box at this field to skip Step 2 - AP Approval Selection. When you check this box and click the Run button, the system assumes you are approving all items listed on the purchase order(s) and proceeds directly to the Step 3 - Individual Vendor Invoice screen.

Vendor Code Vendor CodeSpecify a code for one or more vendors. To enter a single vendor, click on the Search button and select a vendor from the Vendor Cross Reference list. To select one or more vendors, click on the Action button and select vendors from the Multiple Vendor Selection window. To select all vendors, leave this field blank.

Container ID Container ID

Enter an individual container number to select AP Bills for payment by the specified container and vendor. Once Run is selected, the AP Approval Selection grid populates with all the associated purchase orders. If a container number is entered, Trip ID is inactive.

If you entered a single EDI vendor at the Vendor Code field and EDI processing is active, this field is available when you are creating a merchandise AP bill (Process Desired is set to Inventory Activity and Type of Document field is set to Vendor Invoice). Use this field to select purchase order lines associated with a vendor and Trip ID combination. Enter the Trip ID of up to 20 characters or leave the field blank to select all Trip ID's. The vendor and Trip ID you enter are validated against the database record created when the EDI advance ship notice was processed.

Trip ID Trip ID

If you entered a single EDI vendor at the Vendor Code field and EDI processing is active, this field is available when you are creating a merchandise AP bill (Process Desired is set to Inventory Activity and Type of Document field is set to Vendor Invoice). Use this field to select purchase order lines associated with a vendor and Trip ID combination. Enter the Trip ID of up to 20 characters. The vendor and Trip ID you enter are validated against the database record created when the EDI advance ship notice was processed.

Location LocationSelect one or more locations to which you want to restrict the output of this report. If you click on the Arrow, a list of available locations appears, from which you can make a selection. If you click on the Action button, the Multiple Location Selection Window appears, which you can use to select one or more locations.

NOTE: The locations available at this field may be affected by Regional Processing restrictions. That is, only locations to which you have access appear in the lookup.

Reference Number Reference NumberEnter a specific reference number or leave the field blank to select all reference numbers.

Specify a code for one or more vendors. To enter a single vendor, click on the Search button and select a vendor from the Vendor Cross Reference list. To select one or more vendors, click on the Action button and select vendors from the Multiple Vendor Selection window. To select all vendors, leave this field blank.

Order Number Order Number

Enter the original order number. If you are looking for protection plan orders, enter the orginal order number in which the protection plan was applied/purchased.

Type of Document Type of Document

Select Vendor Invoice if approving or deleting invoices for inventory received. Select Vendor Credit to approve or delete credits from vendors.

NOTE: If you select either Special Order Non-Inventory or Pending Merchandise Receipt at the Select Process Desired field, this field defaults to Vendor Invoice and you cannot edit it.

After you make your selections above, click on the Run button. If you did not check the box at Auto Select, the system searches for items to approve or delete using your selection criteria and displays the results on the AP Approval Selection screen (See Step 2 of 3). If the Auto Select option is checked, the system proceeds directly to the Step 3 - Individual Vendor Invoice screen.

Step 2 of 3

In Step 2, the AP Approval Selection screen appears containing the items you selected in Step 1.

If you checked the Auto Select option in Step 1, Step 2 - AP Approval Selection is skipped.

Step 3 of 3

In Step 3, you enter the Enter/Update Individual Vendor Invoice screen, where you create bills for items selected in Steps 1 and 2.
