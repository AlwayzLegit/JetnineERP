---
title: View Virtual Card Payment Status
article_id: 15202012884500
section: 03-payables
index: 57
url: https://storis.zendesk.com/hc/en-us/articles/15202012884500-View-Virtual-Card-Payment-Status
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Use this routine to inquire on the status of virtual card payments. It can help identify payments that the vendor has not yet redeemed.

Bank Bank

Specify a bank to limit your virtual card payment search. Leave blank to select all banks; this is the default.

Date Code Date Code

Use the list of available date codes to limit your virtual card payment search to a specific date range. When any code other than CUS (Custom) is chosen, the Starting Date and Ending Date fields automatically populate with the appropriate date and the fields become inactive.

Starting Date Starting Date

This field is only available if CUS (Custom) is selected in the Date Code field. If so, either enter the starting date or use the associated calendar to choose a date. This date cannot be greater than the date selected in the Ending Date field. This field defaults to null (empty) for Earliest Date.

Ending Date Ending Date

This field is only available if CUS (Custom) is selected in the Date Code field. If so, either enter the ending date or use the associated calendar to choose a date. This date cannot be lesser than the date selected in the Starting Date field. This field defaults to null (empty) for Latest Date.

Starting Payment Number Starting Payment Number

Use this numeric field to enter the starting number of the virtual card payment to frame your search results. The View Check Status and Payment Details process can be used to view the virtual card payment numbers assigned to a virtual card batch. The default is null (blank) for Earliest Payment Number.

Ending Payment Number Ending Payment Number

Use this numeric field to enter the ending number of the virtual card payment to frame your search results. The View Check Status and Payment Details process can be used to view the virtual card payment numbers assigned to a virtual card batch. The default is null (blank) for Latest Payment Number.

Payment Statues to Include Payment Statues to Include

Select (check) the payment status type(s) to include in the search results. One or more boxes may be checked. All boxes are checked by default.

Transmitted - included on a payment file, but not redeemed by the vendor

Completed - redeemed by the vendor

Voided

Grid InformationGrid Information

Double-click a grid item to view more information about the selected payment, such as the bank, via the Payment Review Screen.

Payment Number

Status - payment status of either Transmitted, Completed, or Voided

Date - the pay date of the payment

Vendor

Invoice Numbers

Amount

Virtual Credit Card Numbers

Expiration Date - displayed in MM/YY format

Issue Date

Post Date - the date the funds were actually transferred
