---
title: Create an Account Budget
article_id: 15186352922004
section: 02-general-ledger
index: 2
url: https://storis.zendesk.com/hc/en-us/articles/15186352922004-Create-an-Account-Budget
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > General Ledger > Account Budgets > Create an Account Budget

Use this process to create and maintain budget information for a specified GL account and fiscal year. You can create a budget for any future fiscal year as long as a GL period table exists.

Company CompanySpecify the company for which you want you want to create or edit an account budget. If you click on the arrow, a list of account budgets appears from which you can make a selection. If multi-company processing is active, you can enter any valid company code. Otherwise, the default company appears and you cannot edit the field.

Fiscal Year Fiscal YearSpecify the fiscal year for which you want you want to create or edit an account budget. The default is the next fiscal year. If you click on arrow, a list of fiscal years appears including the current year as well as any future years for which a period table exists. If you select the current year, you can modify only the open periods.

Account AccountSpecify the account for which you want to create or edit an account budget. Enter the full account including the cost center. If you click on the Search button, a list of accounts appears from which you can choose.

Automatic Budget Calculation

You can calculate budget amounts automatically based on a variance percentage.

Base on Variance from Base on Variance from

This field has the following options

None – Perform no automatic calculation.

Current Year’s Total Activity - You can use this option only in the last period of the current fiscal year. Enter a variance percentage of the current year’s annual activity into the Variance Percentage field. The program calculates the annual budget by increasing the current year’s annual activity by the variance percentage. The program automatically apportions 1/12 of the annual amount to each period.

Current Year’s Period Activity - You can use this option only in the last period of the current fiscal year. The program calculates the activity for each period by adding the variance to the activity for same period in the current year.

This Year’s Budget - The program calculates the budget for each period by adding the variance to the budget for same period in the current year.

Variance Percentage Variance PercentageThis field activates after you specify a calculation method. The calculation method specified above references this percentage when calculating new budget amounts. You can enter a negative percentage and the percentage can exceed 100%.

Calculate CalculateClick on this button to re-calculate and display budgets for all selected periods based on the specified calculation method and variance percentage. This button is active only when both have been specified. The program overwrites all existing values.

Grid InformationGrid Information

Once you specify the account and fiscal year, the periods and the current activity display in the grid with each row representing a fiscal period. The grid contains the following columns:

Period Ending – The fiscal period-end date displays.

Period Activity - The actual activity for the current fiscal year displays. For periods with no activity, the period from the previous fiscal year displays and an asterisk appears to indicate it was taken from the prior year.

Current Year Budget – The budget for the current fiscal year displays.

Budget – Use this column to manually specify budget amounts for each fiscal period. The column heading is dynamically built based on the fiscal year specified.

The program calculates totals for all columns and displays them beneath the grid. Note that you can assign budget amounts manually or calculate them automatically.

Manual Budget Specification

You can specify manual budget amounts for each period directly in the Budget column. Or, you can specify an annual budget amount in the Total field. When you specify an annual budget, the program automatically apportions 1/12 of the annual amount to each period. The program overrides any existing period amounts, but a warning messages appears with the option to abort. You can then manually override any period budget amount.
