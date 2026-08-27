---
title: Release Orders from Credit Hold
article_id: 15202312758676
section: 04-receivables
index: 97
url: https://storis.zendesk.com/hc/en-us/articles/15202312758676-Release-Orders-from-Credit-Hold
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > Receivables > Release Order from Credit Hold

Use this routine to monitor orders placed on credit hold. A grid displays one row for each order on credit hold. The grid display can be restricted by selected hold codes via Create a User/Group Receivables Security settings. With security permissions, you can also access the appropriate approval screen from within this screen to view and approve the selected order.

Orders on Credit Hold Orders on Credit Hold

The count of orders on credit hold is displayed. This number reflects only those orders accessible to you according to your location and security restrictions.

Last Refreshed Last Refreshed

The date and time of the last refresh are displayed.

Grid InformationGrid Information

The grid lists orders on credit hold. For each order listed, the following displays.

Order

Date

Customer Code

Customer Name

Credit Hold Code

Code Hold Description

Hold Date

The grid can be filtered or sorted using standard STORIS grid filtering and sorting capabilities. When you first access this screen, the grid is sorted by the Order column.

Orders with multiple credit hold codes are listed on multiple rows, with one row for each credit hold code.

When you double-click an order line in the grid, you automatically access the Update Receivables Credit Approvals, Credit Request Review, or Update Financing Credit Approvals screen, depending on the hold code applied to the order. If your security settings allow, you can view and approve the order from the appropriate approval screen displayed. For example, you double-click an order line with a hold code of C1 indicating "over credit limit". The Update Receivables Credit Approvals screen displays, where you can approve/reject the order.

S1 Credit Holds cannot be manually released. To release the order, obtain the necessary signature or delete the order.

The grid display refreshes automatically according to the refresh rate (if any) in your Accounts Receivable Control Settings. If you do not have a refresh rate established, you must refresh the display manually using the Clear button. You can use the Clear button to refresh the screen at any time, even if you also use the automatic refresh option.
