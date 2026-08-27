---
title: Report Payables Activity
article_id: 15203128570388
section: 01-views-and-reports
index: 44
url: https://storis.zendesk.com/hc/en-us/articles/15203128570388-Report-Payables-Activity
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > Payables > Report Payables Activity

This report has two basic modes:

report open and closed payables activity since the last End-of-Day cycle, including AP bills created and/or adjusted since the last End-of-Day.

report open and closed payables activity for a range of dates.

If you select activity during a specific date range, the report shows ALL activity (bills whether open or closed). If you check the box at the Payment field to include payments on the report, the Payment column indicates the amount paid on the bill, whether fully or partially paid.

The primary sort for the report is Company. Each company starts on a new page. If you choose to include a GL recap (via the Print GL Recap field), the recap prints after all companies have been printed. Once the run-time options have been selected, choose Run to produce the report.

NOTE: This report also runs as part of the End-of-Day process.

Date of Activity

Since Last End of Day Since Last End of Day

To restrict this report to payables activity occurring after the last End-of-Day cycle was run, check the box. Otherwise, leave the field blank. If you check the box, you clear and inactivate the Starting Date and Ending Date fields.

NOTE: If you select this option, adjustments print separately in the body of the report, identified code of ADJ.

Code CodeClick on the Arrow button to view a list of date codes, then select the code that best indicates the time period on which to base your report.

Start StartIf you select CUS at the Date Code field, you activate this field. Use this field to specify the start date of the custom date range for which you want to run this report. If you click on the Calendar Icon, you can select a date from the calendar that appears.

If you select another date code instead of CUS, this field fills in based on that selection and you cannot edit this field.

End EndIf you select CUS at the Date Code field, you activate this field. Use this field to specify the end date of the custom date range for which you want to run this report. If you click on the Calendar Icon, you can select a date from the calendar that appears.

If you select another date code instead of CUS, this field fills in based on that selection and you cannot edit this field.

Bill Activity

Type Type

Use this field to restrict the report to one or more AP bill types. If you click on the Arrow, a list of available AP bill types appears from which you can choose. If you click on the Action button, the Multiple AP Bill Selection window appears, from which you can choose one or more AP bills. If you leave the field blank, you select all bill types.

NOTE: If you select Customer Refund, the report includes a column for customer name and number.

EDI Only EDI OnlyTo include only AP Bills generated via EDI, check the box. Note that if you select a vendor, you inactivate this field.

Status to Include Status to Include

Select the statuses whose AP bills you want to include in the report. You have the following options:

None – Display AP bills without a status.

Pending – Include Pending bills in the display.

Hold – Include AP bills on Hold.

Pending Bills Pending Bills

To include pending AP bills in this report, check this box. Otherwise, leave the box blank. If you check this box, click the Arrow button to select one of the following report options:

All

Pay Before Receipt

Don't Pay Before Receipt

Hold Code Hold CodeSelect one or more hold codes whose AP bills you want to include in the report. If you click on the Arrow, a list of available Hold codes appears from which you can choose. If you click on the Action button, the Multiple Hold Code Selection window appears, from which you can choose one or more hold codes. If you leave the field blank, you select all hold codes.

Additional Options

Company CompanyIf Multi-Company Processing is active, you can specify one or more companies for which to run the report. If you click on the Action button, a list of companies appears from which you can choose. If you leave the field blank, you select all companies.

If not using Multi-Company Processing, the default company appears and the field is inactive.

Report By Report By

Choose a reporting method. You have the following options:

Vendor

Remit-To

Subtotal SubtotalTo include a subtotal for each vendor or remit-to, check the box. Otherwise, leave the box blank. If you check the box, the report sorts and breaks on vendor/remit-to.

Vendor VendorIf you select Vendor at the Report For field, you can restrict the report to one, several, or all vendors. If you click on the Search button, the Vendor Name Search appears from which you can select a vendor. If you click on the Actions button, the Multiple Vendor Selection Window appears from which you can select one or more vendors. If you leave the field blank, you select all vendors.

Remit To Remit ToIf you select Remit-To at the Report For field, you can restrict the report to one, several, or all vendor remit-to's. If you click on the Arrow, a list of remit-to's appears from which you can choose. If you click on the Action button, the Multiple Remit-To Selection window appears from which you can choose.

Payments Payments

To include payments in the report for each AP Bill and/or adjustment, check the box. Otherwise, leave the box blank.

Print GL Detail Print GL Detail

To include GL detail distribution in the report for each AP Bill and/or adjustment, check the box. Otherwise, leave the box blank.

NOTE: If you check this box, the vendor invoice number and invoice date do not print due to space constraints.

If you check the Pending box at the Status to Include field, this field inactivates.

Print GL Recap Print GL Recap

To include a separate GL Recap report in the output, check the box. Otherwise, leave the field blank.

NOTE: If you check this box, the vendor invoice number and invoice date do not print due to space constraints.

If you check the Pending box at the Status to Include field, this field inactivates.

Grid InformationGrid Information

The Type column prints the AP bill Type. The Cde column prints one of the following codes (if applicable):

ADJ – Adjustment to existing AP bill

ADJP – Adjustment to existing pending AP bill

CNV – Converted from Pending status via EOD

EDI – Created via EDI transmission

HLD – Bill is on hold

P - Indicates the bill was originally a pending AP bill

PND – Pending AP bill (new bills only)

Send Report to

Send Output to Send Output toThe output destination of the report displays. To change the output destination, click on the Actions button and select Output Settings.

Export Path Export PathIf you select either the Personal Report Viewer (PRV), Excel Export, or ASCII Export, this field displays the pre-set computer drive and folder location to which the system exports the report data. You cannot edit the export path using this process.
