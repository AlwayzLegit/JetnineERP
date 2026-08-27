---
title: Report Reconciliation of Inventory to GL Values
article_id: 15203113110036
section: 01-views-and-reports
index: 51
url: https://storis.zendesk.com/hc/en-us/articles/15203113110036-Report-Reconciliation-of-Inventory-to-GL-Values
source: STORIS Help Center (storis.zendesk.com)
---

Access

Merchandising and Distribution > Inventory > Inventory Management > Inventory Costing > Reports > Report Reconciliation of Inventory to GL values

Accounting > General Ledger > Additional GL Reports > Report Reconciliation of Inventory to GL values

Accounting > Third Party Accounting > General Ledger > Report Reconciliation of Inventory to GL values

Use this report to research discrepancies between the sales-side inventory valuation and the general ledger inventory value. The report lists changes to inventory costing that occurred

during the time period selected (when running it on demand from the menu), or

since the last Generate Daily Reports (Day Ending/EOD) process was run.

Three versions of the report are available:

Summary - provides a quick total for the various classifications of transactions, each of which either increases or decreases inventory. By looking at the bottom line you can determine if a problem exists. If so, the sub-totals, in comparison with General Ledger information, should provide a clue as to what areas to target. You can then use either the Detail version or the Audit format to pinpoint the problem.

Detail - lists transactions that affected inventory costing changes. The Old Cost column prints the value before the transaction. The New Cost column is the value afterward. The difference displays in the Cost Change GL column and is the exact dollar value of the cost change to inventory value. The Cost Used column shows the amount posted to GL.

Audit - provides detailed cost change information for each piece and costing layer.

Once the run-time options have been selected, choose Run to produce the report.

NOTE: To properly run this report, check the box at the Inventory-G/L Reconciliation Audit field in the Costing Control Settings. Otherwise, the system does not collect all the data pertinent to the report.

To include this report in the Day-Ending (EOD) report process, check the box at the Inventory G/L Recon EOD Report field in the Costing Control Settings.

Location LocationThis field is used to indicate the location or location(s) to be reported. One, multiple, or All locations may be selected. To report on a single location, select a specific location code from the drop-down list at this field. To report on All locations, leave this field blank or select All from the drop-down list. To report on multiple locations, click the Action button at this field and use the Multiple Location Selection process to select the locations for this report.

Category CategoryThis field is used to indicate the category or categories to be included in this report. One, multiple, or All categories may be selected. To report on a single category select a specific category code from the drop-down list at this field. To report on All Categories, leave this field blank or select All from the drop-down list. To report on multiple categories, click the Action button at this field and use the Multiple Category Selection process to select the categories for this report.

Group GroupThis field is used to indicate the product group or groups to be included in this report. One, multiple, or All groups may be selected. To report on a single group select a specific product group code from the drop-down list at this field. To report on All Groups, leave this field blank or select All from the drop-down list. To report on multiple groups, click the Action button at this field and use the Multiple Group Selection process to select the groups for this report.

System/Transaction Date System/Transaction Date

Select the date type on which you want to base the report. When you specify a date range below, the system searches for dates based on the selection you make here. You have the following options:

System Date

Transaction Date

Date Code Date CodeClick on the Arrow button to view a list of date codes, then select the code that best indicates the time period on which to base your report.

Start Date Start DateIf you select CUS at the Date Code field, you activate this field. Use this field to specify the start date of the custom date range for which you want to run this report. If you click on the Calendar Icon, you can select a date from the calendar that appears.

If you select another date code instead of CUS, this field fills in based on that selection and you cannot edit this field.

End Date End DateIf you select CUS at the Date Code field, you activate this field. Use this field to specify the end date of the custom date range for which you want to run this report. If you click on the Calendar Icon, you can select a date from the calendar that appears.

If you select another date code instead of CUS, this field fills in based on that selection and you cannot edit this field.

Report Type Report TypeSelect the detail level wanted for this report. Select Detail for a detailed listing of cost changes, by transaction and product. Select Summary for totals, by location and transaction type, that either increase or decrease inventory. Select Audit for detailed cost change information for individual pieces and costing layers.

Primary Sort Primary SortThis field indicates the item by which the report data will be sorted first. Select the primary sort criteria from the drop-down list at this field.

Secondary Sort, Tertiary Sort Secondary Sort, Tertiary SortThese fields indicate the items by which the report data will be sorted second/third. Select the secondary/tertiary sort criteria from the drop-down list at this field. If no secondary/tertiary sort is desired, leave the field blank or choose None Selected.

Send Output to Send Output toThe output destination of the report displays. To change the output destination, click on the Actions button and select Output Settings.

Export Path Export PathIf you select either the Personal Report Viewer (PRV), Excel Export, or ASCII Export, this field displays the pre-set computer drive and folder location to which the system exports the report data. You cannot edit the export path using this process.
