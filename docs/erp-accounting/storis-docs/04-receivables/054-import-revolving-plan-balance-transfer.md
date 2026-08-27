---
title: Import Revolving Plan Balance Transfer
article_id: 15202312129940
section: 04-receivables
index: 54
url: https://storis.zendesk.com/hc/en-us/articles/15202312129940-Import-Revolving-Plan-Balance-Transfer
source: STORIS Help Center (storis.zendesk.com)
---

Access

Accounting > Revolving Receivables > Import Revolving Plan Balance Transfer

Use this routine to import the plans of multiple customers that are to be transferred to new plans. Only entire plans can be transferred using this routine; individual transactions cannot be transferred. After completion of this process, a PDF report is generated via the Report Data Imported Errors and Warnings screen that details errors, if any, encountered during the transfer process. To transfer individual plans, use Plan Balance Transfer.

The spreadsheet template used to import the data can be obtained from the Downloads page of the STORIS support site. Here are a few rules for using this import :

The MMP Amount column in the spreadsheet is valid only when the new plan is a "Using a Fixed Table" or "As a Fixed Amount" type plan.

Each row in the grid for the same customer that is being transferred to the same plan must list an MMP Amount. Otherwise, a null amount indicates that the plan balance transfer process should calculate the MMP Amount on fixed table or fixed amount new plans and the amount overrides the MMP amounts entered on the other rows.

Validation occurs on a plan by plan basis, so that the eligible plans can be transferred, even if on a row with ineligible plans.

Balances can be transferred to closed plans.

PC Path of Spreadsheet PC Path of Spreadsheet

Use this field to designate the location of the spreadsheet to be imported. You can either enter the path directly into the field, or click the Action button to choose the file on your local drive. After uploading the file, click Run.

After clicking Run, the Report Data Imported Errors and Warnings screen opens. The Include Errors and Include Warnings checkboxes are checked by default. Click Save to finish running the report.
