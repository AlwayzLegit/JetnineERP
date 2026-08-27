---
title: Import Vendors from Third Party Accounting
article_id: 15173492553748
section: 00-accounting
index: 2
url: https://storis.zendesk.com/hc/en-us/articles/15173492553748-Import-Vendors-from-Third-Party-Accounting
source: STORIS Help Center (storis.zendesk.com)
---

(Initial Vendor Transfer From TPA)

AccessAccess

Accounting > Third Party Accounting > General Ledger > Import Vendors from Third-Party Accounting

STORIS recommends you create your vendors in STORIS. However, if using the QuickBooks interface and you have existing vendors in QuickBooks® and do not yet have any vendors in STORIS, you can use this routine to transfer the vendors from QuickBooks to STORIS. If you are not sure which vendor creation method is appropriate for your company, contact your STORIS representative.

Warning!! This process overwrites vendors in STORIS. If you need to run this process, run it once during initial startup only. Once you create vendors in STORIS, do not run this routine unless instructed by STORIS.

To Transfer From QuickBooks to STORIS:

In QuickBooks, create a Vendor Type of 'STORIS' and then set the Type field to 'STORIS' for each vendor you want to transfer.

Access this routine (that is, Import Vendors from Third Party Accounting) and specify the address lines in QuickBooks from which to populate the Address Line 1 and Address Line 2 fields in STORIS. STORIS creates the vendor record, including a 5-character key in the Vendor Code field. This key consists of the first three characters from the Company Name field in QuickBooks appended by a 2-digit sequential number starting with '00'. By using this method to create vendors, each vendor has a different key in STORIS and in QuickBooks.

NOTE: The Vendor file contains an internal field called TPA Equivalent that STORIS uses as an internal cross-reference to the vendor key in QuickBooks. This field is not accessible. If the terms code from the QuickBooks vendor does not exist in STORIS, the system looks to the TPA equivalent field. If a match exists, the system uses that STORIS terms code for the STORIS vendor. If a match is not found for the actual terms code or the TPA equivalent, the system assigns a terms code of null for the STORIS vendor.
