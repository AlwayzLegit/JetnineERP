---
title: Report Product with Low Stock
article_id: 15203112885652
section: 01-views-and-reports
index: 48
url: https://storis.zendesk.com/hc/en-us/articles/15203112885652-Report-Product-with-Low-Stock
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Merchandising and Distribution > Inventory > Inventory Management > Inventory Views and Reports > Inventory Reports > Report Product with Low Stock

Merchandising and Distribution > Inventory > Inventory Views and Reports > Inventory Reports > Report Product with Low Stock

This report lists all products that have quantities less than the minimum quantities stated in their individual Warehouse Inventory records or in the Product record. Depending on the Status Type selected, this report informs that stock has either

fallen below the minimum quantity entered in the Warehouse Inventory record,

fallen below the safety stock quantity entered in the Warehouse Inventory record, or

a quantity-on-hand of zero.

Once the run-time options have been selected, choose Run to produce the report.

NOTE: The output of this report may be affected by Regional Processing restrictions.

Report Product with Low Stock only looks at the Warehouse Inventory Settings, not the Product file. The settings in the Product file only default if the values are used when a new warehouse is created, not to update a current one.

The run-time options for this report are:

Product ProductUse this field to indicate the products you want to includ in this report. To report on a single product, select a specific product code at this field. To report on all Products, leave this field blank. To report on multiple products, use the Multiple Product Selection screen (available from Actions) to select the products for this report.

Group GroupThis field is used to indicate the product group or groups to be included in this report. One, multiple, or All groups may be selected. To report on a single group, select a specific group code at this field. To report on All Groups, leave this field blank. To report on multiple groups, use the Multiple Product Group Selection screen (available from Actions) to select the groups for this report.

Category CategoryThis field is used to indicate the category or categories to be included in this report. One, multiple, or All categories may be selected. To report on a single, category select a specific category code at this field. To report on All Categories, leave this field blank. To report on multiple categories, use the Multiple Product Category Selection screen (available from Actions) to select the categories for this report.

Brand Brand

This field is used to indicate the brand or brands to be included in this report. One, multiple, or All brands may be selected. To report on a single brand, select a specific brand code at this field. To report on All Brands, leave this field blank. To report on multiple brands, use the Multiple Brand Selection screen (available from Actions) to select the brands for this report.

NOTE: If specific products were selected at the Product field, the Brand field will not be available for entry.

Inventory Type Inventory Type

Select the type of inventory you want to include in the report. You have the following options:

All Inventory - for both retail and service parts products.

Retail Inventory - report on retail products only.

Parts Inventory - report on service parts products only.

Status Type Status Type

Select the status type. You have the following options:

Safety - reports on products with a quantity-on-hand below the safety quantity set in the Warehouse Inventory records.

Minimum - includes products with a quantity-on-hand below the minimum quantity set in the Warehouse Inventory records.

Zero - reports on products with a quantity-on-hand of zero.

Detail Level Detail Level

Select the detail level you want to use for this report. You have the following options:

Product - prints the sum of the minimum quantities at all warehouses for which a minimum quantity has been specified.

Warehouse Inventory - for all selected products, prints the sum of the minimum quantities at selected warehouses. The warehouse must have a minimum quantity specified.

Primary Sort Primary SortSelect Category (C), Brand (B), or Group (G) to indicate the item by which the report data is to be sorted in the Primary (first) sort.

Secondary Sort Secondary SortSelect Category (C), Brand (B), or Group (G) to indicate the item by which the report data is to be sorted in the Secondary (second) sort. If no secondary sort is desired, choose None Selected.

Tertiary Sort Tertiary SortSelect Category (C), Brand (B), or Group (G) to indicate the item by which the report data is to be sorted in the Tertiary (third) sort. If no tertiary sort is desired, choose None Selected.

Region Region

Enter the code of the region to which you want to restrict the output of this report. If you click on the Arrow, a list of regions appears from which you can choose. If you select Multiple Regions from that menu, or if you click on the Action button next to the Arrow button, the Multiple Region Selection Window appears from which you can choose one or more regions.

NOTE: This field is active only if you select Warehouse Inventory at the Detail Level field and no selection exists in the Location field.

Location Location

Enter the locations you want to include in this report. If you know the code of the location, enter it directly. If you click on the Arrow, you can choose a location from the list that appears. If you select Multiple Locations from the list, you access the Multiple Locations Selection Window, from which you can choose one or more locations. You can also access the Multiple Locations Selection window if you click on the Action button. If you click on the Search button in the Multiple Locations Selection Window, you access the Multiple Selection Lookup Window. Use this window to select all locations (that is, all locations available to you) by clicking on Select All.

NOTE: At this and any other Location field, the locations you see (that is, the list of locations available to you) may be affected by Regional Processing restrictions.

This field is active only if you select Warehouse Inventory at the Detail Level field and no selection exists in the Region field.

Exclude Special Order Products Exclude Special Order ProductsTo exclude special order products from the output of this report, check the box. Otherwise, leave the box blank.

Exclude Obsolete Products Exclude Obsolete ProductsTo exclude obsolete products from the output of this report, check the box. Otherwise, leave the box blank.

Send Output to Send Output toThe output destination of the report displays. To change the output destination, click on the Actions button and select Output Settings.

Export Path Export PathIf you select either the Personal Report Viewer (PRV), Excel Export, or ASCII Export, this field displays the pre-set computer drive and folder location to which the system exports the report data. You cannot edit the export path using this process.
