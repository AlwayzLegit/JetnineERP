---
title: Repair Metro 2 Customer Credit History
article_id: 15202279812756
section: 04-receivables
index: 98
url: https://storis.zendesk.com/hc/en-us/articles/15202279812756-Repair-Metro-2-Customer-Credit-History
source: STORIS Help Center (storis.zendesk.com)
---
Repair Metro 2 Customer Credit Reporting

Access

Accounting > Revolving Receivables > Metro 2 Features > Repair Metro 2 Customer Credit History

Use this routine to repair data on certain fields included in the credit reporting data, for example if your credit bureau discovers errors in your report. This process contains the fields for which errors are most commonly reported. It is available only for the last credit history file created.

NOTE: The Credit Reporting Resource Guide specifies you must make changes prior to the next file submission. Because of this restriction, STORIS prevents changes to historical data files.

Once you make changes and click on Save, all data updates occur and the program creates a file called

MM_DD_YYYY_REPAIR (where MM_DD_YYYY represents the original file name)

Note that only one "repair" file can exist for a reporting period, meaning that any changes you make at a future time in the reporting period overwrite the existing repair file. This includes additional changes to records you already changed. The program also updates the Customer Comments file when change a field via this routine.

Once you specify a valid customer who exists in the credit reporting file, the Credit History File Name and Customer Code fields inactivate and the other fields activate and populate with information (if any) from the credit history file.

Credit History File Name

The name of the most recent credit reporting file displays.

Metro 2 ID

Enter the Metro 2 ID. Click the Search button to select an ID from the list. For revolving customers, enter the Customer Code. For installment customers, enter Customer Code*Installment Plan.

Payment History Profile

This field displays the customer's past 24-month payment history, excluding the most recent month. Reference this field to ensure the customer's payment history is current before running the report.

Each number represents a payment code for that given cycle period, while "0" means that no cycle processing was run; the letter "B" indicates periods where the customer was not on file. You can use the Payment History Profile accessed via Customer Credit and Scoring Information to edit the customer's payment history. If present, the word Modified indicates that an update has been made to the customer's 24-month payment history.

Compliance Condition Code

Enter the code of the compliance condition you want to assign to this customer. If you click on the Arrow button, a list of compliance codes appears from which you can choose. Changes to this field list in the Customer Comments file.

Account Status

Enter the code of the account status you want to assign to this customer. If you click on the Arrow button, a list of account statuses appears from which you can choose. The list includes only account statuses for which the Manual Assignment field is enabled in the Account Status Settings. This field is active only if an account status has been specified for the customer and that status is flagged for manual assignment (via the Manual Assignment field in the Account Status Settings. Changes to this field list in the Customer Comments file.

Special Comment

Enter the code of the special comment (if any) you want to assign to this customer. If you click on the Arrow button, a list of special comments appears from which you can choose. Changes to this field list in the Customer Comments file.

Consumer Information Indicator

The Consumer Information Indicator (CII) works in conjunction with legal codes, similar to the other Metro2 codes . The CII cannot be manually assigned to a legal code. Instead, CIIs are automatically assigned to legal codes related to bankruptcy or reaffirmation of debt. The Legal Code Settings process will display the CII in the grid for any legal codes that have one for reference. When a legal code with a CII is assigned to a customer, the CII will be applied accordingly, and the Metro2 reporting process will reflect this in greater detail when reporting bankruptcy information.

Date of First Delinquency

Enter the date of first delinquency. If you click on the Calendar Icon, a calendar appears from which you can select a date. Changes to this field list in the Customer Comments file.
