---
title: Close/Update Fiscal Periods
article_id: 15186352924564
section: 02-general-ledger
index: 0
url: https://storis.zendesk.com/hc/en-us/articles/15186352924564-Close-Update-Fiscal-Periods
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > General Ledger > Fiscal Periods > Close/Update Fiscal Periods

Use this process to close open GL periods and/or reopen closed GL periods.

Company Company

Enter the code of the company whose GL periods you want to open or close. If you click on the Arrow, a list of companies appears from which you can choose. If multi-company processing is active, you can enter any valid company. If not, the default company appears and you cannot edit it.

Fiscal Year Fiscal Year

Enter the fiscal year whose GL periods you want to open or close. If you click on the Arrow, a list of fiscal years appears from which you can choose. The list contains an entry for each closed year for which a period table exists. The period table displays along with the GL Closed, GL Reopened, and Sales Closed flags for each period. The column for Sales Closed displays for reference purposes only. Sales periods close when you run the Sales end-of-month (period), and you cannot reopen them once they have been closed.

Action Action

Select the action you want to perform. You have the following options:

Close - If any period is open, including period 13, the default selection is Close

Reopen - If all periods are closed, the default selection is Reopen

Fiscal Period Fiscal PeriodSpecify the fiscal period you want to close or reopen. If you select Close at the Action field, only open periods are available, with the earliest open period defaulted. If the Action field is set to Reopen, only closed periods are available with the latest closed period defaulted.

The program performs your selected action when you click on Save.

Period Close

The GL Fiscal Period Close process disallows any additional postings to the fiscal period you select for closing. You can select any open period as long as the sales period has been closed. You can select period 13, which has the effect of closing the entire year. You can select a period even when prior open periods exist. Closing a period with prior open periods results in all prior periods being closed. A warning message appears but you can proceed. When closing a period where open periods exist in prior years, period 13 of the prior year does not close unless you are specifically closing period 13 for the year selected. Instead, you must manually close period 13 and therefore close the prior year.

Period Reopen

You can select any closed period, including period 13, which has the effect of reopening the entire year. You can select a period even though subsequent closed periods exist. Re-opening a period with subsequent closed periods results in all subsequent periods being reopened. A warning message appears but you can proceed. The Allow Reopen Years field in the General Ledger Control Settings controls the number of periods you can be reopen. If this flag is set to zero, the system allows you to reopen periods from the current year but not from any previous years. The check is based on the most recent open year that has not been previously reopened, even if it occurs in the past.
