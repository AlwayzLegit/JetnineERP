---
title: View and Manage AP Bills
article_id: 15202013507476
section: 03-payables
index: 54
url: https://storis.zendesk.com/hc/en-us/articles/15202013507476-View-and-Manage-AP-Bills
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Use this routine to view a selection of AP bills.

Use the checkboxes at the beginning of the grid to select bills to remove from hold. Clicking Remove Hold removes the hold status and hold code of these bills and brings up the message, "Hold status has been removed from ~AP bills." If you select Remove Hold and none of the bills you have chosen are on hold, you get the error message, "No bills updated. Double check that selected bills are on hold." No change is made to bills not on hold.

NOTE:The search fields and the Search button can be reselected. In this case, the information in the grid is overwritten. Use the Clear button to delete and reselect criteria.

Date Code Date Code

Select one of the following codes to set the Start Bill Date and End Bill Date. An AP bill falls within this date range if its transaction date is between these dates. This field defaults to "CUS". You can choose from the following date codes:
-CUS: Custom Dates. Select this to specify your own date range.

-TDAY: Today. Select this to set the Start Bill Date and End Bill Date to today's date. You cannot enter the dates manually.

-YDAY: Yesterday. Select this to set the Start Bill Date and End Bill Date to yesterday's date. You cannot enter the dates manually.

-CPTD: Current Period to Date: Select this to set the Start Bill Date and End Bill Date to the starting date of the current period and the end date will be set to the current date.

Start Bill Date Start Bill Date

AP Bills with a transaction date on or after the date set here will show in the search results. You can only enter a date here if the Date Code is set to CUS.

End Bill Date End Bill Date

AP Bills with a transaction date on or before the date set here will show in the search results. You can only enter a date here if the Date Code is set to CUS.

Company Company

The dropdown lists the companies you can access. Use the extra action to call up the Multiple Company Selection process in which you can name several companies. Leave this field empty to choose AP bills for all companies you have access to. This field is empty by default. Note that if Multi-company processing is active, this field is active.

Invoice Number Invoice Number

Enter the invoice(s) for a vendor. The process, Select Multiple Bills from Invoice Number, can be called up via an extra action button. This field is only active if a single vendor has been specified in the Vendor field. When an invoice number is entered, the fields for Invoice Types and Credit Types are inactive.

Vendor Vendor

Use this field to specify vendors. The lookup button calls up the Vendor Name Search process or you can select extra action button to call the Multiple Vendor Selection process.

If you select On Hold Only, you can leave this field empty to choose AP bills on hold for all vendors.

Bank Bank

This dropdown lists all banks. Use the extra action button to call up the process, Multiple Bank Selection, in which you can specify multiple banks. Leave blank to select all AP Bills for all banks. This field is null by default.

It is reccommended that you set the Company field to "All Companies". Only banks assigned to the companies you have named yield results.

On Hold Only On Hold Only

By selecting this checkbox, you show only those AP bills that are on hold in the search results. If this box is unchecked, you are shown AP bills that are both on and off hold unless the Hold Code field is filled in. If you do not check this field, you must set the Vendor field to enhance search performance. This checkbox is unchecked by default

Hold Code Hold Code

This dropdown lists all hold codes. Use the extra action button to call up the process Multiple Hold Code Selection, in which you can specify more than one hold code. You can leave this field empty if desired.

From EDI and Not From EDI From EDI and Not From EDI

Use these checkboxes to set whether AP bills created through EDI should be included. You must check at least one of these boxes. If you check From EDI, you restrict the selection to bills created through EDI. If you check Not From EDI, you restrict the selection to bills not created through EDI. If you check both, bills created both through EDI and not through EDI are included. These boxes are both checked by default.

Invoice Types Invoice Types

Here you can set which types of vendor invoice bills you want to include. All these boxes default to being checked, to include all types of bills. You must select at least one type from this range or from the Credit Types checkboxes.

The boxes you can choose from under Invoice Types are:

Merchandise
Expense
Freight
Direct Ship
Customer's Own Material
Customer Refund
Special Order Non-Inventory

Credit Types Credit Types

Here you can set which types of vendor credit bills you want to include. All these boxes defult to being checked, to include all types of bills. You must select at least one type fro this range or from the Invoice Types checkboxes. The boxes you can choose from are:

-Merchandise
-Expense
-Freight
-Vendor Receivables
-Service Warranty
-Adjusted Inventory (bills created in Enter a Stock Adjustment through the vendor chargeback.)

Grid InformationGrid Information

-Bill Number

-Vendor Code

-Vendor Name

-Invoice Number

-Invoice Date

-Invoice Total

-Hold Code

-Bill Type

-View: Click this to call up the AP bill in View AP Bill process

-Maintain: Clicking this button calls up the AP bill in the process Enter/Update Individual Vendor Invoice. When you save out of this process, all updates are applied to the bill right away. When you save out of Enter/Update Individual Vendor Invoice, the grid refreshes with new information. If you clear or exit from the process, View and Manage AP bills, the changes to the AP bill are not discarded.

-Company

-Bank

-EDI: The columns shows "yes" if the bill was create via EDI and "No" if it was not.

-Terms Code

-Terms Date
Terms Discount
-Discount AMount
-Due Date
