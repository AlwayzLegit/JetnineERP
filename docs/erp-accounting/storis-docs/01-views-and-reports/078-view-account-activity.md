---
title: View Account Activity
article_id: 15295155897236
section: 01-views-and-reports
index: 78
url: https://storis.zendesk.com/hc/en-us/articles/15295155897236-View-Account-Activity
source: STORIS Help Center (storis.zendesk.com)
---

Access

Accounting > General Ledger > View Account Activity

Tabs: Summary, Detail

Use this inquiry to display detailed account activity for a selected GL account. You can display multiple levels of detail. That is, for a selected account, you can display data based on any of the following:

sub-account

cost center

source

weekly totals

daily totals

detailed batch postings

By selecting a level of detail, you can re-populate the grid with data for each level of detail. The column headings change as required.

Header Area

Use the header area to specify the required data, display the level selections, and display each level balance. Use the grid to select any subsequent entries for sub-account, cost center, period, and source.

Fiscal Year Fiscal YearEnter the fiscal year in which the activity you want to view occurred. If you click on the Arrow, a list of valid fiscal years appears.

Company CompanyEnter the code of the company associated with GL account you want to view. If multi-company processing is active, you can enter any valid company code. If not, the default company appears and you can not edit it. If you click on the Arrow, a list of valid companies appears from which you can make a selection. If you click on the Search button, the Multiple Company Selection screen appears from which you can choose one or more companies.

Account AccountEnter the root account you want to view. If you click on the Arrow, a list of valid root accounts appears from which you can make a selection. If you click on the Search button, the GL Account Description Lookup screen appears from which you can choose one or more accounts. If you leave the field blank, you select all root accounts.

Balance Balance

When the Level field (above the grid) is set to Sub-Account, the Root Account Balance displayed here shows the total for the Root account. This amount should match the Ending column total for all subaccounts displayed in the grid. When the Level field is set to Cost-Center, the Sub-Account Balance displayed in this field shows the total for the selected subaccount and should match the Ending column total for all cost centers displayed in the grid.

Additional information on the selected account (if any) displays in the header area, for example, sub-account and balance.

Summary

The Summary tab contains a grid that repopulates each time you specify a different level. After you specify the required item, the Summary grid populates with all available sub-accounts for the specified account. At this point, you can click on a grid row to "drill down" on a specific sub-account or click the Next button, bringing you to the next level of detail (except when all the sub-accounts are displayed in the grid). Drill-down levels are as follows:

sub-account (if applicable)

cost center

period

source

week (if you are set to a weekly calendar)

day

If you click the Next button, you access the next level of detail until you reach the lowest level of detail (that is, the Daily level). You can also select a specific grid row to narrow the next level displayed to that single selection. For example, to see a weekly breakdown for all sources, click the Next button when the Source grid displays. To see a weekly breakdown for just TEOE, select that grid row.

Likewise, the Previous button bring you back up one level. The current level displays at the Level field . You can use go directly to any level, higher or lower. For example, you can select Day directly from the Cost Center level. A Daily summary displays for all cost centers, periods, and sources. You can go directly to a higher level using this method.

Level LevelThe current level of detail displays. To select a different level, click on the Arrow. Your options display.

Previous PreviousTo move to the previous level of detail, click this button.

Next NextTo move to the previous level of detail, click this button.

Detail

You can access the detail level for any batch via any summary level. You select the Detail tab which displays a grid of detail batch postings. Detail postings display for whatever is currently displayed on the Summary tab. (If you are at a high summary level this may take a few seconds - a Progress Bar indicates progress). Select a grid line to display the View a Journal Entry inquiry where document drill-down is available as well as full view of remarks, etc.
