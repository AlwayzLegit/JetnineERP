---
title: Report Cash Drawer Balancing Totals
article_id: 15202504439828
section: 01-views-and-reports
index: 27
url: https://storis.zendesk.com/hc/en-us/articles/15202504439828-Report-Cash-Drawer-Balancing-Totals
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Customer > Point of Sale > Cash Balancing > Report Cash Drawer Balancing Totals

Customer > Point of Sale > POS Views and Reports > POS Manager Views and Reports > Report Cash Drawer Balancing Totals

Customer > Customer Service > Cash Balancing > Report Cash Drawer Balancing Totals

Accounting > Receivables > Report Sales Receipts > Cash Balancing > Report Cash Drawer Balancing Totals

Accounting > Receivables > Point of Sale > Cash Balancing > Report Cash Drawer Balancing Totals

This report lists all monies received at a cash entry terminal for a selected day. The report formats by either standard cash balancing or extended cash balancing, based on the Extended Cash Balancing Report field in the Cash Balancing Control Settings. Once the report criteria have been selected, click Run to produce the report.

If you choose to balance by store, the report displays totals for each store as well as a grand total. The report also displays the breakout and totals for payment type.

The Cash Drawer Balancing Totals report lists daily receipts for individual cash drawers. To list details of all receipts for a day, use the Report Daily Receipts Register.

Since credit card refunds on customer returns are often not associated with a cash drawer entry, they do not appear on the Cash Drawer Balancing Totals report. In addition, STORIS does not post credit card refunds on customer returns to Cash Balancing at the time of entry except if the order is a customer drop-off. For other customer returns, STORIS assumes a lag period will occur between the time the return is entered into the system and when the merchandise is actually returned and the customer return completed. Therefore, since the transaction does not post until the customer return is completed, the transaction would often not appear on a daily cash balancing report on the day the customer return was entered into the system, anyway.

Totals for check payments that were electronically processed and converted (EC) are separate from totals for non-EC check payments.

NOTE: For back-dated payments, STORIS posts to the cash drawer based on system date and not the back date. For example, if you enter a payment on 7/12 and back-date it to 7/10, the payment lists on the Cash Balancing report for 7/12. In this way, STORIS prevents you from writing payments to a cash drawer that has been closed or balanced. However, the payment shows on 7/10 for both the customer account the GL account. To list both the system date and the transaction date for selected payments, use the Report Daily Receipts Register routine.

The output of this report may be affected by Regional Processing restrictions. That is, you can inquire only about customers and locations to which you have access.

Date Code Date CodeClick on the Arrow button to view a list of date codes, then select the code that best indicates the time period on which to base your report.

Balance Date Balance DateIf you select CUS at the Date Code field, you activate this field. Use this field to specify the balance date for which you want to run this report. If you click on the Calendar Icon, you can select a date from the calendar that appears.

If you select another date code instead of CUS, this field fills in based on that selection and you cannot edit this field.

Starting Time Starting TimeTo restrict the report to payment totals for a specified time period, enter the starting time 24-hour military time format (that is, HH:MM). For example, for at 3:00 P.M., enter 15:00 in this field.

Ending Time Ending TimeTo restrict the report to payment totals for a specified time period, enter the ending time 24-hour military time format (that is, HH:MM). For example, for 3:00 P.M., enter 15:00 in this field.

Balance By Balance By

You can base the report on balancing by

drawer,

cashier, or

store.

The selection you make at this field determines which of the Drawer, Operator, or Store fields below are active. If you balance by store, the report displays totals for each store as well as a grand total.

Drawer DrawerTo restrict the report to a specific drawer, enter the number of the drawer or click the Search button and select a drawer from the list that appears. If you leave this field blank, you report on all cash drawers. This field is active only if you select Drawer at the Balance By field.

Operator OperatorTo restrict the report to a specific operator, enter the number of the operator. If you click on the Search button, a list of operators appears from which you can choose one or more. If you click on the Action button, the Multiple Staff Selection Window appears from which you can select one or more operators. If you leave this field blank, you report on all operators. This field is active only if you select Operator at the Balance By field.

Store StoreTo restrict the report to a specific location, enter the number of the location. If you click on the Arrow button, a list of locations appears from which you can choose one or more. If you click on the Action button, the Multiple Location Selection Window appears from which you can select one or more locations. If you leave this field blank, you report on all locations. This field is active only if you

- select Store or Operator at the Balance By field, and

- leave the District field blank.

District DistrictTo restrict the report to a specific district, enter the number of the location. If you click on the Arrow button, a list of districts appears from which you can choose one or more. If you click on the Action button, the Multiple District Selection Window appears from which you can select one or more districts. If you leave this field blank, you report on all districts. This field is active only if you leave the Store field blank.

Balanced Drawer Reference Balanced Drawer ReferenceTo restrict the report to a specific balanced drawer reference, enter the reference or click the Search button and select a reference from the list that appears. If you enter a valid reference here, you de-activate the other Drawer fields on the screen.

In this way, you can display all postings to a drawer regardless of the posting date, thus making manager overrides viewable even if performed on a different date.

Unbalanced Drawer Reference Unbalanced Drawer ReferenceTo restrict the report to a specific unbalanced drawer reference, enter the reference or click the Search button and select a reference from the list that appears. If you enter a valid reference here, you de-activate the other Drawer fields on the screen.

In this way, you can display all postings to a drawer regardless of the posting date, thus making manager overrides viewable even if performed on a different date.

Send Output to Send Output toThe output destination of the report displays. To change the output destination, click on the Actions button and select Output Settings.

Export Path Export PathIf you select either the Personal Report Viewer (PRV), Excel Export, or ASCII Export, this field displays the pre-set computer drive and folder location to which the system exports the report data. You cannot edit the export path using this process.
