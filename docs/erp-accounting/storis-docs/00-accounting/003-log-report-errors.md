---
title: Log Report Errors
article_id: 15173468669716
section: 00-accounting
index: 3
url: https://storis.zendesk.com/hc/en-us/articles/15173468669716-Log-Report-Errors
source: STORIS Help Center (storis.zendesk.com)
---

The following list provides brief explanations of the types of errors that can appear on the Report on Third Party Accounting Transmission Errors report.

TPA Vendor update failed; invalid reference to QuickBooks® Terms: This message indicates that a reference to a terms code in the STORIS Vendor record exists in STORIS but is missing in QuickBooks®. The complete error message includes the ID of the terms code that is missing in QuickBooks. For every Terms code in STORIS, a matching Terms code must be added manually to QuickBooks.

Cost center missing in QuickBooks: This error message indicates that a cost center exists in STORIS, but there is no corresponding Class in QuickBooks. For every cost center created in STORIS, there must be a corresponding "Class" set up in QuickBooks.

TPA AP Post failed; invalid reference to QuickBooks Vendor: This message indicates that a vendor exists in STORIS, but not in QuickBooks. (See the Creating Vendors section of the TPA Setup Using Defaults instructions for detail regarding vendor setup.)

Cost center missing in STORIS: This error message indicates that a cost center exists (as a Class) in QuickBooks, but there is no corresponding cost center in STORIS. For every "Class" set up in QuickBooks, there must be a corresponding cost center in STORIS. To add a cost center in STORIS, use the GL Cost Center Settings program.

GL account missing in STORIS: This message indicates that a GL account exists in QuickBooks, but not in STORIS. At all times, the GL accounts that your company is using must exist in both STORIS and in QuickBooks. If you have created additional GL accounts in QuickBooks, you MUST transfer them to STORIS using the Transfer Third-Party Accounting Information process, Transfer GL Accounts From TPA option.

Out of balance batch in QuickBooks: This message indicates a problem that rarely occurs. Please log a call with STORIS Customer Service if this error is listed on the log report.

Cannot open QuickBooks: This message indicates that the company to which transactions are being transferred could not be opened in QuickBooks. Prior to running Batch Transfer To TPA processes, users are urged to open a QuickBooks session, making sure that the "transfer to" company is open. However, if QuickBooks is open for a different company (not the company for which transfers are being run), this message is reported and no posting takes place. The incorrect company needs to be closed in QuickBooks, the correct company opened, and the transfer re-run.
