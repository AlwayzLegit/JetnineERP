---
title: Report Accounts Receivables Aged Trial Balance
article_id: 15202503184020
section: 01-views-and-reports
index: 21
url: https://storis.zendesk.com/hc/en-us/articles/15202503184020-Report-Accounts-Receivables-Aged-Trial-Balance
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > Receivables > Receivables Reports > Report Accounts Receivables Aged Trial Balance

Accounting > Revolving Receivables > Revolving Reports > Report Accounts Receivables Aged Trial Balance

Accounting > Installment > Installment Reports > Report Accounts Receivables Aged Trial Balance

This report shows the AR balance for each account, broken down by current and aged receivables. The report sorts by store location, with an optional secondary sort by customer class. The following report types are available:

Detail - breaks down each account balance by transaction type

Summary - displays only the total receivables for each account

Audit - displays additional detail including component amounts of each transaction (for example, deposit applied, payment received, etc.)

Total - displays the grand totals only

Once you choose your options, click Run to process the report.

NOTE: When you run this report on demand, the report displays long term revolving amounts only if you select today's date as the As Of Date.

Totals and grand totals shown at the end of the report are broken out by Open Item and Long Term Revolving (if applicable).

The output of this report may be affected by Regional Processing restrictions. That is, you can inquire only about customers and locations to which you have access.

This report runs as part of the End-of-Month process.

Date DateClick on the Arrow button to view a list of date codes, then select the code that best indicates the time period on which to base your report.

As Of As OfIf you select CUS (custom) at Date Code field, you activate this field. Use this field to specify the as-of date for which you want to run this report. If you click on the Calendar Icon, you can select a date from the calendar that appears.

If you select another date code instead of CUS, this field fills in based on that selection and you cannot edit this field.

District DistrictEnter the code of the district to which to restrict this report. If you click on the Arrow, a list of available districts appears from which you can choose one or more. If you click on the Action button, the Multiple District Selection window appears from which you can choose one or more. If you enter a district at this field, you de-activate the Store field below.

Store StoreEnter the code of the store to which to restrict this report. If you click on the Arrow, a list of available stores appears from which you can choose one or more. If you click on the Action button, the Multiple Location Selection window appears from which you can choose one or more. If you enter a store at this field, you de-activate the District field above.

Group by Store of Activity Group by Store of Activity

Check this box if you want to group data based on the store in which the transaction activity takes place. Note that if you select this option, you cannot use the resulting report to audit your general ledger. Note that long term receivable balances are reported only if this box is not checked.

Leave this box blank if you want to group data based on the store associated with the customer via the Store Assignment field in the Advanced Customer Settings.

NOTE: When this report runs as part of the End-of-Month process, it groups data by store assignment.

Customer Customer

Enter one or more customers to whom you want to restrict this report. If you click on the Search button, the Search for a Customer window appears which you can use to select a customer. If you click on the Action button, the Multiple Customer Selection window appears from which you can choose. If you leave the field blank, you select All customers.

NOTE: If you enter a response at the Customer Class field, you inactivate this field.

Customer Class Customer Class

Enter one or more customer classes to which you want to restrict this report. If you click on the Action button, the Multiple Entry Window appears in which you can enter one or more customer classes. If you leave this field blank, you select All customers.

When you run this report, the system searches the Customer Class field in the Customer Settings and includes all customers whose class matches any of the classes you enter here.

NOTE: If you enter a response at the Customer Account field, you inactivate this field.

Secondary Sort Secondary SortTo apply a secondary sort by Customer Class, check the box. Otherwise, leave the box blank.

Payment Agreement Payment Agreement

If revolving receivables is active and you have customers with payment agreements set up on the system, you can run this report for a specific payment agreement source. Click the Search button to select a source code from the Read-Only Lookup Window. If you select a payment agreement source, the District, Store, Customer Account, Customer Class, Secondary Sort by Class, and Group Data By fields become inactive.

Report Report

Select the type of report you want to produce. You have the following options:

Detail - breaks down each account balance by transaction type (The customer's code or name displays on the detail report, depending on the Report Sort By setting in your Accounts Receivable Control Settings.)

Summary - displays only the total receivables for each account (The summary version displays only the customer code and not the name.)

Audit - displays additional detail including component amounts of each transaction (for example, deposit applied, payment received, etc.)

Total - displays the grand totals only

Store Totals - produces a summary version with store totals only; also checks the box at Exclude Comments and inactivates that field.

Aging Aging

Select the aging method you want to produce. You have the following options:

Periodic - with this aging method, portions of the customer's balance may appear as a current, past due and future due receivables.

Bank - with this aging method, the customer's total accounts receivable balance is reported based upon its oldest A/R item.

Recency - with this aging method, the customer's total accounts receivable balance is reported based upon the customer's last payment date. If last payment date is less than or equal to 30 days the total AR balance is reported as 'Current'. If last payment date is greater than 30 days the total AR balance is reported in the aging column based on the customer's last payment date. Thus, when using the recency method of aging, the customer balance never appears in the 1-30 column. If the customer has not made any payments the bank aging method is used, which reports the total AR balance in the oldest aging column.

NOTE: When this report runs based upon Store of Activity or if it is run as a Detail or Audit report, the aging method is set to Periodic and cannot be changed.

For the Periodic and Bank aging methods, the customer’s open items are aged based upon their due date and the date of the report. Credits are then applied based upon the Credit Aging Method in the Accounts Receivable Control Settings. For example, the customer has a $100 balance that is 31-60 days old, a $150 current balance, and a $600 Long Term Balance.

--Using the example above and the Periodic Aging Method, $150 is reported as current, $100 is reported as 31-60 days past due and $600 is reported as future due reported in the A/R Balance Column.

--Using the example above and the Bank Aging Method, the customer’s total balance of $850 is reported as 31-60 days past due.

Exclude Exclude

Use this field to include or exclude the following options:

Customers with NO activity - Check this box to exclude customer that have no activity. Otherwise, leave the field blank.

Customers with ZERO balance - Check this box to exclude customers that have a zero balance. Otherwise, leave the field blank. If checked, customers with a net zero open item receivable balance and no long term receivable balance are not reported, while customers with a long term receivables balance are reported, even if the open item receivable balance nets to zero. This is regardless of whether or not Group by Store of Activity is checked.

Credit Transactions - Check this box to exclude credits from the aging calculation as well as Long Term Revolving credit balances (checking this field does not prevent credit balances from showing on the report). Otherwise, leave the field blank.

Comments - To include customer credit comments in the report, check the box. Otherwise, leave the field blank. If you check the box, the report includes comments entered in the Account Comments field on the Point of Sale tab in the Advanced Customer Settings for selected customers. This field is active only if you select Detail or Audit at the Report field.

Send Output to Send Output toThe output destination of the report displays. To change the output destination, click on the Actions button and select Output Settings.

Export Path Export PathYou cannot edit the export path using this process.
