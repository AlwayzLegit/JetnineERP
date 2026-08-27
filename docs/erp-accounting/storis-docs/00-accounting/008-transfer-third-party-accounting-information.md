---
title: Transfer Third Party Accounting Information
article_id: 15173468994068
section: 00-accounting
index: 8
url: https://storis.zendesk.com/hc/en-us/articles/15173468994068-Transfer-Third-Party-Accounting-Information
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > Third Party Accounting > General Ledger > Transfer Third Party Accounting Information

Use this program to run the following processes.

Transfer GL Accounts From TPA Transfer GL Accounts From TPA

The STORIS default GL chart of accounts was pre-loaded in STORIS during installation of the Third Party Accounting module. If additional accounts are created in QuickBooks®, these need to be transferred to the STORIS system using this process. Contact your STORIS representative for further detail.

Transfer Vendors to TPA Transfer Vendors to TPA

During initial setup, STORIS recommends creating your vendors in STORIS and then transferring them to QuickBooks® using this process. Select this option to transfer vendors created in STORIS to the Third Party Accounting system (i.e. QuickBooks). This process transfers only vendors flagged as 'New'. (For more information on creating vendors, see TPA Setup Using Defaults.) Note: This option is not available if using STORIS Accounting.

NOTE: This option is automatically selected if the Post AP Transactions to TPA option is selected. If using STORIS Accounting, this field is not available. (Vendor synchronization is performed automatically.)

Post AP Transactions to TPA Post AP Transactions to TPA

This process is used to transfer any un-transmitted AP approved batches to QuickBooks. In addition, associated GL transactions are automatically transmitted when this option is selected.

NOTE: When the Post AP Transactions to TPA option is selected, the Transfer Vendors to TPA option is automatically selected.

Post GL Transactions to TPA Post GL Transactions to TPA

When the Post AP Transactions or Post Credit Transactions process is selected, associated GL transactions are automatically transmitted. Use this option to transmit GL transactions other than AP and Credit approvals, such as sales, inventory adjustments, receipts, etc. to QuickBooks.

Post Customer Refunds to TPA Post Customer Refunds to TPA

This process is used to transfer any un-transmitted approved Customer Refund batches to third-party accounting (QuickBooks® for example). In addition, associated GL transactions are automatically transmitted when this option is selected.

Important Note to QuickBooks® Users! To ensure that the transfer processes run efficiently, we strongly recommend that, prior to running the transfers, you open a QuickBooks® session. Make sure that the company for which you want to run transfers is open. Warning: If QuickBooks® is open for another company (not the company for which transfers are being run), errors occur during the transfer process and the transactions are not posted.

Following selection of the process or processes, select Run. The program indicates the processes that are In Progress. If there is an error in the process, the program displays ERROR next to the process where the error occurred. Additionally, the program may display the message "Error(s) occurred in TPA interface. Please review logs." Run the Report on Third Party Accounting Transmission Errors to view the error log. Contact your STORIS representative for further detail.
