---
title: Print Checks
article_id: 15202012944788
section: 03-payables
index: 40
url: https://storis.zendesk.com/hc/en-us/articles/15202012944788-Print-Checks
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > Payables > Process Checks > Print Checks

Use this routine to print checks for existing check runs with a status of Pending.

NOTE: The option to print a check register is available at the conclusion of each successful check run. See the Checks Printed Successfully field below.

The invoice detail information printed on the AP check stub is sorted according to the Sort Detail Lines on Stub by setting on the Advanced tab of Payables Control Settings.

If Print refund checks in Create a User/Group Actions - Payables Security is not enabled, and the payment batch includes customer refunds, users must provide a security override to complete this process.

Check Layouts

STORIS offers Check Forms options as well as an Enhanced Laser option in which you can use the Forms Designer to print checks. Use the Payables Control Settings to choose. Either way, you need to use standard check stock with pre-printed check, routing, and account numbers. Contact your STORIS representative for more information. Note that you can also print checks in foreign currency.

BankBank

Select the code of the bank associated with your check run. Once a bank is selected, the system checks to see if multiple payment batches are allowed (i.e. Allow Multiple Payment Batches is active in Bank Settings).

If multiple payment batches are allowed and a pending batch exists, the Date and Code fields become active and populated with only Check Type pending batches.

If multiple payment batches are not allowed and the program finds a pending check run for the bank, the date and time of the check run display and you can proceed. Otherwise, the program rejects the entry and you must create a pending check run for the bank or select another bank.

DateDateThe date on which the selected pending check run was created displays.

TimeTimeThe time of day at which the selected pending check run was created displays.

Status Status

One of the following statuses displays for the check run:

Not Started – No checks have yet been printed.

Alignment Printed – A check alignment has been printed.

In Progress – Checks are being printed.

Confirm Successful Check Print – Checks have been printed - confirm that checks have printed successfully.

Once you specify a valid bank with an existing pending check run, the Starting Check Number field activates.

Starting Check Number Starting Check NumberThe starting check number displays from the Next Check Number field in the Bank Settings. You can edit this field, but the number you enter must be greater than the existing number.

When you edit this field, the routine asks if you want to void the unused check numbers you skipped. If you answer No, the starting check number reverts back to the Next Check Number. If you answer Yes, the system checks to see if there is an AP payment register record for the check numbers that were skipped. If any of the numbers are found to have been used, and they are not voided, the routine displays a message indicating the check numbers that were used and that these checks are not being voided. This prevents the system from voiding check numbers used for manual checks. Only unused checks are voided.

Next Check to Print Next Check to PrintThe number of the next check to print appears. If you click on the Print Alignment button, the program voids the current check number and increments to next number. The incremented number displays at this field.

Sort Checks by Bill NumberSort Checks by Bill Number

To sort checks by AP bill number, check the box. This function is available only for refunds (vendor RFND). The program assigns the lowest check number to the lowest bill number. If other vendors exist in the check run, this field is not active and the report sorts by vendor.

NOTE: This field is not affected if Print Refunds at End of Check Run in Payables Control Settings is enabled.

This field overrides Print Checks by Descending Amount in Payables Control Settings. If this field is enabled as well as Print Checks by Descending Amount, checks print by AP bill number, not descending check amount.

Limit Detail to One Check Limit Detail to One Check

Check this box to skip printing the detail for checks when the number of detail lines exceeds the Detail Lines on Stub setting in Payables Control Settings. Instead, "See Separate Detail Page" is printed. This setting is unchecked by default.

NOTE: The Separate Check per Bill and Suppress Invoice Details on Checks in Vendor Settings are not affected when Limit Detail to One Check Stub is checked.

Print Checks Print ChecksTo print the check run, click on this button. A progress bar displays with a Cancel Button you can click on to stop the check print at any time before completion. Note that pressing the Cancel button stops, not pauses, the check run. However, if you cancel check printing, you can void selected checks and resume printing by pressing the Print Checks button again (see the documentation for the fields below).

After you click on the Print Checks button, the Starting Check Number field and the Print Alignment and Print Checks buttons inactivate and the Check Printed Successfully field activates.

Checks Printed Successfully Checks Printed SuccessfullyIf all checks print successfully, leave the box checked and click on the Save button to complete the update process and run the Report Payables Disbursement routine from which you can print a check register. If the check run did not print successfully, un-check the box to access the next two fields.

Last Successful Check Last Successful Check

If the check run did not print successfully, enter the number of the last check to print successfully. This field is active only if the Checks Printed Successfully box is blank.

If you leave this field blank, the Next Available Check field clears and inactivates, and the program assumes no checks in the check run printed successfully. If you enter a last successful check number here, use the Next Available Check field to indicate where you want to resume check numbering.

After you make your selections, a message appears indicating the check numbers (if any) that will re-print.

Next Available Check Next Available CheckIf the check run did not print successfully, enter the next available pre-printed check number. The number you enter must be greater than the Last Successful Check number.

Update Checks Update ChecksTo perform the updates indicated in the Last Successful Check and Next Available Check fields, click on this button. This field is active only if the Last Successful and Check Next Available Check field are null or the Next Available Check is more than one greater than the Last Successful Check.

Note that if printing problems occur, you do not have to automatically void check numbers if checks were not actually damaged. If you void a check, the system stores the check with a status of void and you cannot use that check number again. Instead, you can simply clear the check numbers so they are available again for printing.

If you leave the Last Successful Check and Next Available Check fields empty, the program reprints all checks after and including the Next Check to Print and before the Next Available Check. However, if you enter check numbers into these fields, the program:

voids checks between but not including the Last Successful Check and Next Available Check.

clears and makes available for reprint all checks greater than or equal to the Next Available Check and less than the Next Check to Print.

Once the updates complete, the Next Check to Print field resets to the next available check number, the Print Alignment and Print Checks buttons re-activate, and you can print an alignment and/or reprint checks. This cycle continues until you check the All Checks Printed Successfully field and click on Save.

NOTE: You cannot start a check run print, save it, and resume it at a later time. When you click on the Exit button, a warning appears that you are about to void all checks. However, the system retains the Pending status for the check run so you can modify the check run and again print checks or delete the check run.
