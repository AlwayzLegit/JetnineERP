---
title: Report Pre-Approval Credit Statistics
article_id: 15203128570004
section: 00-accounting
index: 5
url: https://storis.zendesk.com/hc/en-us/articles/15203128570004-Report-Pre-Approval-Credit-Statistics
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Use this routine to report on credit pre-approvals (no established credit and no link to financed orders) by reviewer, salesperson, store location, and review status code. The report provides total counts for each status category - declined, pending, and approved. The report includes auto approvals from the credit bureau, and can be run for auto approvals only. You can run the summary and detail versions of the report or the summary only.

Date Code Date Code

Click the Arrow button to view a list of date codes, then select the code that best indicates the time period on which to base your report.

Starting, Ending Date Starting, Ending Date

If you select CUS at the Date Code field, you activate these fields. Use these fields to specify a range of credit request dates for which you want to run this report. The date range is used to report based on the dates that the review items were submitted to the lenders. If you click on the Calendar Icon, you can select a date from the calendar that appears. If you select another date code instead of CUS, these fields fill in based on that selection and you cannot edit this field.

Reviewer Reviewer

You can run this report for one or more specific reviewers or for all reviewers. Click the Search button to select a reviewer from the list of users, or click the Action button to access the Multiple Staff Selection Window, where you can select multiple reviewers. Leave the field blank to report on all reviewers.

NOTE: The reviewer is the person who made the final decision or is in the process of making the decision for a review item.

In the case of auto-approvals from the credit bureau, the report displays "auto" in the reviewer name column.

Salesperson Salesperson

You can run this report for one or more specific salespeople associated with the credit request process, or for all salespeople. Click the Search button to select a salesperson from the drop-down list, or click the Action button to access the Multiple Salesperson Selection Window, where you can select multiple salespeople. Leave the field blank to report on all salespeople.

District District

If regional processing is active, you can restrict this report by district. Click the Arrow button to select a district code or click the Action button to access the Multiple District Selection Window, where you can select multiple districts. Leave the field blank to report on all districts.

NOTE: If regional processing is active, you can restrict the report by district or store, but not both. If you enter a value in this field, the store field becomes inactive and vice versa.

Store Store

You can restrict this report to one or more specific store locations. Click the Arrow button to select a store from the list or click the Action button to access the Multiple Location Selection Window, where you can select multiple locations. Leave the field blank to report on all store locations.

NOTE: If regional processing is active, you can restrict the report by store or district, but not both. If you enter a value in this field, the district field becomes inactive and vice versa.

Review Status Review Status

You can run this report for one or more specific credit review status codes. Click the Search button to select a review status code from the drop-down list, or click the Action button to access the Multiple List Selection Window, where you can select multiple review status codes. Leave this field blank to report on all review status codes.

Reason Code Reason Code

You can run this report for one or more specific reason codes associated with credit review items. Click the Search button to select a code from the list or click the Action button to access the Multiple Reason Code Selection Window, where you can select multiple reason codes. Leave this field blank to report on all reason codes.

NOTE: Only reason codes with the Reason Usage Code field set to Credit Application are available for selection at this field.

Auto Approvals Only Auto Approvals Only

To report on only auto-approvals from the credit bureau, check this box. To report on all pre-approvals, including auto-approvals, leave the box blank.

NOTE: If you check the box at this field, the Reviewer field above is inactive.

The reviewer name column on the report displays "auto" for auto-approvals.

Summary Only Summary Only

To produce the detail and summary versions of the report, leave this field blank. To produce a summary report only, check this box.

Primary Sort, Secondary Sort, Tertiary Sort Primary Sort, Secondary Sort, Tertiary Sort

Use these fields to select the sort order for the data on the report. Click the Arrow button to select from the following options:

Reviewer

Salesperson

Location

Credit Review Status

Reason Code

NOTE: The Primary Sort field is mandatory and the Secondary and Tertiary sorts are optional. At the Secondary and Tertiary sort fields, you can choose "None Selected".

Send Output to Send Output toThe output destination of the report displays. To change the output destination, click on the Actions button and select Output Settings.

Export Path Export PathIf you select either the Personal Report Viewer (PRV), Excel Export, or ASCII Export, this field displays the pre-set computer drive and folder location to which the system exports the report data. You cannot edit the export path using this process.

NOTE: When output is set to Personal Report Viewer, Excel Export, or ASCII Export, a column labeled "Source" is present after the "Pend Cnt" column. The Source column displays how the credit application was submitted:
-Empty - The credit application was submitted in-store (via STORIS).
-Kiosk - The credit application was submitted via an in-store kiosk.
-[IP Address] - The credit application was submitted via the web. The IP address displayed is that of the PC the customer used when submitting the application.
