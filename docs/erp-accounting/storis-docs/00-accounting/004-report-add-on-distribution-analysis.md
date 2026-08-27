---
title: Report Add-on Distribution Analysis
article_id: 15202503993108
section: 00-accounting
index: 4
url: https://storis.zendesk.com/hc/en-us/articles/15202503993108-Report-Add-on-Distribution-Analysis
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Merchandising and Distribution > Inventory > Inventory Management > Inventory Costing > Reports > Report Add-on Distribution Analysis

This report displays information on variances between estimated landed add-on costs and actual landed add-on costs. Note that all records that fit the selection criteria appear in the report, regardless of whether the Distribute Add-on Receiving Costs process was used to distribute add-on costs to that receipt. Once the report criteria have been selected, click Run to produce the report.

NOTE: For credit Warehouse receivings, the program adjusts receipt quantities accordingly.

Report Type Report Type

Specify the report type. You have the following options:

Summary - prints only the vendor totals, sorted by country (if selected) then add-on type.

Detail - sorts by add-on type, receipt vendor, and then model number.

Both report types have an optional sort by country. When sorting by country, a page break occurs when a new country is reported on.

Start Date Start DateTo restrict the report results to only those receipts that occurred after a selected date, enter the date here. If you click on the Calendar Icon, you can select a date from the calendar that appears.

End Date End DateTo restrict the report results to only those receipts that occurred after a before date, enter the date here. If you click on the Calendar Icon, you can select a date from the calendar that appears.

Model Number Model NumberEnter one or more model numbers to which you want to restrict the results of the report. If you click on the Search button, the Search for a Product window appears from which you can select one or more model numbers. If you click on the Action button, the Multiple Product Selection Window appears from which you can select one or more model numbers. If you leave the field blank, all model numbers are eligible for selection.

Note that if you enter one or more model numbers here, you inactivate the Product Group and Product Category fields.

Group Number Group NumberEnter one or more product groups to which you want to restrict the results of the report. If you click on the Search button, a list of product groups appears from which you can choose one or more. If you click on the Action button, the Multiple Group Selection Window appears from which you can select one or more groups. If you leave the field blank, all product groups are eligible for selection.

Note that if you enter one or more product groups here, you inactivate the Model Number and Product Category fields.

Category CategoryEnter one or more product categories to which you want to restrict the results of the report. If you click on the Search button, a list of product categories appears from which you can choose one or more. If you click on the Action button, the Multiple Category Selection Window appears from which you can select one or more product categories. If you leave the field blank, all product categories are eligible for selection.

Note that if you enter one or more product categories here, you inactivate the Model Number and Product Group fields.

Vendor VendorEnter one or more vendors to which you want to restrict the results of the report. Enter the vendor associated with the purchase order (which is not necessarily the vendor associated with the product). If you click on the Search button, the Vendor Name Search appears from which you can choose. If you click on the Action button, the Multiple Vendor Selection Window appears from which you can select one or more vendors. If you leave the field blank, all vendors are eligible for selection.

Country CountryEnter one or more countries to which you want to restrict the results of the report. Enter the country associated with the receiving vendor. If you click on the Search button, a list of countries appears from which you can choose one or more. If you leave the field blank, all countries are eligible for selection.

Report

Add-On Cost - the amount of add-on cost distributed to the receipt for the invoice.

Tot Add-On - the total of the Add-On Cost column for this receipt.

Invoice Percent - the percent of the Add-On Cost relative to the Receipt Cost.

Total Percent - the percent of the Tot Add-On column relative to the Receipt Cost.

Type - the type of calculation used by the add-on costs (either D for a set dollar amount or P for a percentage).

Current Add-On - the current dollar or percentage used to calculate the add-on costs at receiving time.

Variance Percent - the percentage greater or less than that the Total Percent is in relation to the Current Add-On percent.

Grid InformationGrid Information

Use the grid to refine your report output. To run the report, you must select at least one row in the grid by clicking the box in the Action column. The grid contains a row for each of the add-on costs active in your system. If only one cost is active, that costing type defaults.

If you check the box on the Include/Invoice Details row, the report includes the following information on the line below the receipt line.

invoice number

invoice vendor

invoice date

add-on cost

invoice percent

invoice comments

The invoice number prints in the reference number column, the comments print in the model number column, the invoice vendor prints in the invoice vendor column, and the invoice date prints in the invoice date column. The invoice date and invoice vendor columns appear in the report only when you check this box.

Note that if you run the Summary version of the report, the program un-checks this box and inactivates the field.

If you check the box on Sort/By Country row, the resulting report contains the current country as a subtitle. A new page prints for each country.
