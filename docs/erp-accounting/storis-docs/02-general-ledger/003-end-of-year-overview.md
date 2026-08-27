---
title: End of Year Overview
article_id: 50891164193940
section: 02-general-ledger
index: 3
url: https://storis.zendesk.com/hc/en-us/articles/50891164193940-End-of-Year-Overview
source: STORIS Help Center (storis.zendesk.com)
---

This overview discusses how to close a fiscal year. It reviews:

Steps to take before closing the year
How to make end of year adjustments
How to close the year in Close/Update Fiscal Periods
Prior to Closing the Fiscal Year

Before closing your fiscal year, all 12 periods of the year must be closed.

Each fiscal year has a period 13, this gives you a place to make end of year adjustments when your other periods are closed. You must manually close period 13 to close the year, even if you close period 1 in the following year period 13 will remain open until it is closed.

Making End of Year Adjustments

The following reports can be used to compare against your GL:

Report Value of Inventory
Report Accounts Receivable Aged Trial Balance
Report Payables Activity
Report Completed Sales Dollars

Use Post/Update a Journal Entry to balance any discrepancies in period 13. When creating a batch in period 13, do not specify a date and use Type Y (End of Year Journal Entry) for your postings.

You can review any of your end of year postings with Report End of Year GL Adjustments.

Before closing the period the system will notify you that it is checking for any open freight batches and unposted transactions prior to the first day of the next period. If open freight batches are found, you can view them via the View Open Freight Batches process accessed via the magnifying glass lookup in Receive a Purchase Order with a Separate Freight Bill, then close the Batch within that process.

If any unposted transactions are found, use Report Suspended Postings and correct any suspended postings in Post/Update a Journal Entry.

Closing the Fiscal Year

Watch the video below to see how to close a period using the Close/Update Fiscal Periods process.

Once you've closed the 12 periods, your retained earnings are posted to the account you specify in the Retained Earnings account in the Company Settings. The program takes the ending balance of the closing year in the specified GL account and adds the total from all Profit & Loss (P&L) accounts for that year. Since all P&L accounts reset to a zero beginning balance in the new year, their net activity is closed into retained earnings.
