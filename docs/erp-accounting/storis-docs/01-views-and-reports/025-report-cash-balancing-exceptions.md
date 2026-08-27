---
title: Report Cash Balancing Exceptions
article_id: 15202553291668
section: 01-views-and-reports
index: 25
url: https://storis.zendesk.com/hc/en-us/articles/15202553291668-Report-Cash-Balancing-Exceptions
source: STORIS Help Center (storis.zendesk.com)
---

Access

Accounting > Receivables > Report Sales Receipts > Cash Balancing > Store Manager Balancing Functions > Report Cash Balancing Exceptions

Customer > Point of Sale > Cash Balancing > Store Manager Balancing Functions > Report Cash Balancing Exceptions

Customer > Point of Sale > POS Views and Reports > POS Manager Views and Reports > Report Cash Balancing Exceptions

This routine reports on cash balancing exceptions. Once the report criteria have been selected, click Run to produce the report. This report runs during the End-of-Day process only when Extend Cash Balancing is checked in Cash Balancing Control Settings. The report is divided into two sections:

Unassigned Transactions - lists any transaction not assigned to a cash drawer, either because it was outside the time range for which the cash balancing was run, or the cash drawer was never balanced.

Suspense Cash Drawers - lists all transactions where the operator/cashier exceeded the number set in the Number of Tries field (Cash Balancing Control Settings) during Blind Cash Balancing and the transactions therefore need to be approved by a manager.

Unassigned Transactions

System Date is the date the transaction was entered.

Transaction Date is the date for which the transaction was entered. For example, if you made the entry today for a transaction that occurred yesterday, Transaction Date would display yesterday's date and the System Date column would display today's date.

System Time is the time that the transaction was entered into the system.

Store is the identifying number of the store/warehouse at which the transaction occurred.

Drawer is the drawer number through which the transaction occurred.

Operator is the identifying initials of the operator/cashier who entered the transaction.

Reference is the payment reference (identifying code, which in some cases can be the order number) for this transaction. Each transaction, regardless of the type of transaction (for example, deposit, gift certificate purchase, etc.) has an identifying code. That code is displayed in this column.

Pay Type displays the method of payment. Possible options are Check, Cash, Credit Card, or the code for a particular type of financing.

NOTE: If payment is by credit card, the code for a particular card may appear, MC for MasterCard, etc.

Amount is the payment amount for this transaction.

Suspense Cash Drawers

Transactions listed in this section of the Report Cash Balancing Exceptions require a manager's approval.

Date is the date that the exception was generated, and this transaction was consequently recorded in the suspense file.

Drawer Reference is the number identifying the cash drawer that the operator/cashier was trying to balance when the allotted number of tries was exceeded.

This column is one of the following, depending on the Cash Balancing Control Settings, Group Payments by field:

Cashier

Drawer

Store

Start and End times are the start and end times that were set for the indicated drawer during the Balance a Cash Drawer process.

Send Output to

The output destination of the report displays. To change the output destination, click on the Actions button and select .

Export Path

If you select either the Personal Report Viewer (PRV), Excel Export, or ASCII Export, this field displays the pre-set computer drive and folder location to which the system exports the report data. You cannot edit the export path using this process.
