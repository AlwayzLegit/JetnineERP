---
title: Report Metro 2 Customer Credit History
article_id: 15202279810324
section: 04-receivables
index: 99
url: https://storis.zendesk.com/hc/en-us/articles/15202279810324-Report-Metro-2-Customer-Credit-History
source: STORIS Help Center (storis.zendesk.com)
---

Access

Accounting > Revolving Receivables > Metro 2 Features > Report Metro 2 Customer Credit History

Use this routine to report customer receivable information to your credit bureau. The report includes data created since the last time you ran this report. If no new credit history data exists, a system message displays and you cannot access the routine.

This report excludes customers

whose charge-off date (if any) is prior to the credit reporting period.

for whom the Do Not Report to Credit Bureau box is checked in the Customer Legal Settings; this routine is accessed via the Legal Settings option on the Actions button on the Receivables page of the Advanced Customer Settings.

In addition, the Accounts Receivable Control Settings contains three fields you can use to restrict the accounts that appear on this report. You can exclude customers

paid out for a user-defined number of cycles,

with a credit balance for a user-defined number cycles, and/or

with a cycle balance of zero, a last cycle balance of zero, and whose account is less than a user-defined number of months old.

This report includes only

United States customers,

Revolving Receivables information, and also includes compliance condition codes and the date of first delinquency based on the requirements of the Fair Credit Reporting Act and/or Fair Credit Billing Act.

Start Date Start Date

The date of the day after you last ran a credit reporting displays. You cannot edit this field.

Ending Date Ending Date

The current system date displays. You cannot edit this field.

Compliance Condition Codes

Once you report a compliance condition code, the Compliance Condition Code Reported Date updates in the Customer file with the current system date. When determining which compliance condition code to report to the credit bureau, the program examines the

compliance condition code,

compliance condition code updated date, and the

compliance condition code reported date.

If the compliance condition code reported date is greater than or equal to the compliance condition code updated date, or no compliance condition code exists in on the Customer record, a blank appears in the report for the Compliance Condition Code. Otherwise, the report includes the Compliance Condition Code that exists in the Customer file. Once a compliance condition code is reported, the current system date updates in the Compliance Condition Code Reported Date field.

Date of First Delinquency

The system records the date on which customers first become delinquent. Consumer reporting agencies use this date to determine when to remove a delinquent status from a customer (pursuant to the Fair Credit Reporting Act (FCRA)). Note that the system does not remove a delinquent date until the customer becomes current. Once current, if the customer becomes delinquent again, the system assigns a new date of first delinquency.
