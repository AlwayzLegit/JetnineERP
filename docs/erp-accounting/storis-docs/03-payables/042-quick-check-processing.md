---
title: Quick Check Processing
article_id: 15202012719892
section: 03-payables
index: 42
url: https://storis.zendesk.com/hc/en-us/articles/15202012719892-Quick-Check-Processing
source: STORIS Help Center (storis.zendesk.com)
---

Use this feature to print checks directly from the Enter/Update Individual Vendor Invoice process. You must specify a bank and pay date for the current AP bill.

Select this option (via the Quick Check Active field on the Check Information tab in the Enter/Update Individual Vendor Invoice process), and the process's behavior depends on if multiple pending payment batches are allowed (via the Allow Multiple Payment Batches in Bank Settings).

If multiple pending payment batches are not allowed: a prompt appears with the option to activate Quick Check Processing for the selected bank and pay date. If you answer Yes, the Quick Check Active field inactivates and the quick check information appears in the status area of the screen header. The Bank and Pay Date fields also inactivate as well as the Alternate Payment Method fields.

If multiple pending payment batches are allowed: a prompt appears to enter the Batch Payment Code. Once the code is entered, click Save. The system validates the batch payment code to ensure that a check run for that Bank/Date/Code does not already exist.

When you exit, a prompt appears asking if you want to continue with the check print, and the following options appear:

Yes – Proceed to Print Checks.

No – Abort the Exit and remain in the Enter/Update Individual Vendor Invoice process.

Cancel – Delete all the AP bills ready for check printing. A prompt appears and if you answer Yes, the program deletes all current AP Bills and you return to the menu. If you answer No, you return to the Enter/Update Individual Vendor Invoice process.

NOTE: Quick Check Processing is not available if a Pending Check Run exists for the bank (that is, only one Pending Check Run can exist for a bank at one time). This is unless multiple pending payment batches are allow for a bank. A bill cannot be added that already exists on a pending check run.

Once you activate Quick Check status, it remains active for the remainder of the AP bill approval process.

To print checks, you must have security clearance, established via the Print accounts payable checks in the Extended Security routine. The Check Processing feature is available only if using STORIS Accounting.
