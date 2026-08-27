---
title: Update Revolving Insurance Plans
article_id: 15202312377108
section: 04-receivables
index: 116
url: https://storis.zendesk.com/hc/en-us/articles/15202312377108-Update-Revolving-Insurance-Plans
source: STORIS Help Center (storis.zendesk.com)
---

Access

Receivables > Revolving Receivables > Update Revolving Insurance Plans

Use this routine to update revolving plan insurance codes using an import spreadsheet. This process can be used to add insurance codes to active revolving plans or remove insurance codes from active or inactive revolving plans. Audit comments are written to the Customer Activity Log, although the master revolving plan is not updated.

The Excel spreadsheet template used to import the data can be obtained from the Downloads page of the STORIS support site. The following columns are contained in the spreadsheet:

Customer ID - This field is mandatory. It must be an existing customer as defined in Advanced Customer Settings.

Plan ID - This field is required if Default Insurance from Other Plans in Revolving Receivables Control Settings is not checked; the plan must be an existing plan for the customer. This field is populated automatically if Default Insurance from Other Plans in Revolving Receivables Control Settings is set; the insurance code is populated in all revolving plans for the customer. An error appears if a Plan ID is entered here.

Insurance Code - This field is mandatory and must contain either of the below. The rules that exist for Enter a Customer's Revolving Terms & Conditions are followed, such as the insurance code must be valid for the customer's store.

A valid code as defined in Extended Receivables Insurance Code Settings, which is used to add the insurance code to the active plan. Insurance charges are not assessed on past balances.

The clear designator as defined in the Clear Data/Field Indicator field in General System Control Settings, which is used to remove the insurance code from an active or inactive plan. Existing insurance charges are not forgiven.

NOTE: After completing the spreadsheet, the file must be saved at a tab delimited text file (.txt) or as a .cvs file before it can be uploaded.

Filename Filename

Enter the path of the spreadsheet to be imported. Click the extra Action button to choose the path of the spreadsheet on your local PC. This field is initially blank, but once a path and file name is selected, this field automatically populates with the previous path and file name.

NOTE: While insurance codes can be updated when a customer is inactive, no updates occur when a customer is in charge off status.

After clicking Run, the Report Update Revolving Insurance Plans automatically runs and displays errors that occurred during this Update Revolving Insurance Plans process.

Examples of errors that prevent updates are:

The customer provided does not exist.

The insurance plan is not valid for the customer's store.

The customer is charged off.

The customer does not have any revolving receivable plans.

The insurance code provided does not exist.
