---
title: Report Payables Aged Trial Balance
article_id: 15203112476052
section: 01-views-and-reports
index: 45
url: https://storis.zendesk.com/hc/en-us/articles/15203112476052-Report-Payables-Aged-Trial-Balance
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > Payables > Payables Views and Reports > Generate a Trial Balance

Use this routine to report payable balances as of a specified date. Once the run-time options have been selected, choose Run to produce the report.

Company CompanyIf Multi-Company Processing is active, you can specify one or more companies for which to run the report. If you click on the Action button, a list of companies appears from which you can choose. If you leave the field blank, you select all companies.

If Multi-Company Processing is not active, the system company defaults and you cannot edit this field.

Date Code Date CodeClick on the Arrow button to view a list of date codes, then select the code that best indicates the time period on which to base your report.

As Of Date As Of DateIf you select CUS (custom) at Date Code field, you activate this field. Use this field to specify the as-of date for which you want to run this report. If you click on the Calendar Icon, you can select a date from the calendar that appears.

If you select another date code instead of CUS, this field fills in based on that selection and you cannot edit this field.

AP bills that were back-dated may not be included on the report if they were not active on or before the As Of Date that you specify.

Aging Type Aging Type

Click on the Arrow button to view a list of aging types, then select the type on which to base your report:

Forecast - use this type to run the standard version of the report. The standard mode provides information on the outstanding invoices as of a given future date and is used to determine cash requirements to pay off the outstanding payables.

Past Due - use this type to run the alternate version of the report. To view past due invoices only, you also need to check the Past Due Only check box. To include current invoices, leave the Past Due Only field blank.

Past Due Only Past Due OnlyCheck this box if you want to run report for past due invoices only. To include current invoices, leave the field blank. Note, this field is only active if you have selected Past Due as the Aging Type.

Summary Only Summary Only

To generate a summary report of vendor totals without the AP Bill detail, check the box. Otherwise, leave the box blank.

NOTE: This option is not available for the PRV.

Vendor VendorSpecify one or more vendors to which you want to restrict the output of this report. If you click on the Search button, the Vendor Name Search appears from which you can select a vendor. If you click on the Action button, the Multiple Vendor Selection Window appears from which you can select one or more vendors. If you leave the field blank, you select all vendors.

Vendor Class Vendor ClassEnter one or more vendor classes to which you want to restrict the output of this report. If you click on the Arrow, a list of vendor classes appears from which you can choose. If you click on the Action button, the Multiple Vendor Classes Selection Window appears. If you leave the field blank, you select all vendor classes. If you select a vendor at the Vendor field, you inactivate this field.

Aging Days Aging DaysEnter the number of days to use for aging buckets. The default is set based on the Bill Aging Days from the Payables Control Settings.

Buyer Buyer

Enter the buyer to which you want to restrict this report. If you click on the Search button, a list of buyers appears from which you can choose. If you leave this field blank, you select all buyers. Buyers are users with a buyer group specified in the User file.

AP bills display only if the buyer on a linked purchase order matches the specified buyer.

Country CountryEnter one or more countries to which you want to restrict the output of this report. If you click on the Arrow, a list of countries appears from which you can choose. If you click on the Action button, the Multiple Country Selection Window appears. If you leave the field blank, you select all countries.

Sort by Country Sort by CountryIf you choose to run the report for more multiple or for all countries at the Country field, this field is active. To sort by payables country, check the box.

Sort by Invoice Sort by InvoiceTo sort the report by invoice number, check this box. Otherwise, leave the box blank. Regardless of your selection at this field, the report sorts first by vendor.

Debit Balances Only Debit Balances OnlyTo generate a report of vendors with debit balances only, check the box. Otherwise, leave the field blank. This field is active only if the As of Date is set to the current date.

Hold Code Hold CodeEnter one or more hold codes to which you want to restrict the output of this report. If you click on the Arrow, a list of hold codes appears from which you can choose. If you click on the Action button, the Multiple Hold Code Selection Window appears. If you leave the field blank, you select all hold codes.

Send Output to Send Output toThe output destination of the report displays. To change the output destination, click on the Actions button and select Output Settings.

Export Path Export PathIf you select either the Personal Report Viewer (PRV), Excel Export, or ASCII Export, this field displays the pre-set computer drive and folder location to which the system exports the report data. You cannot edit the export path using this process.
