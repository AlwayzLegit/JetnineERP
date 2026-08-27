---
title: Print a Customer Statement
article_id: 15202310636692
section: 04-receivables
index: 86
url: https://storis.zendesk.com/hc/en-us/articles/15202310636692-Print-a-Customer-Statement
source: STORIS Help Center (storis.zendesk.com)
---

Access

Accounting > Receivables > Print Receivables Document > Print a Customer Statement

Use this program to print new customer statements or re-print old statements that have been moved to the History file.

For new statements, the program uses the customer information created in the Cycle Process during End-of-Day processing. You can print All, Regular, or Hold statements.

Following the printing of regular statements, the statements move to the History File. If you do not print regular statements, they move to the History File during the next customer cycle process. That is, before the cycle process creates statements, any existing statements not yet printed move to the History File. The Statement History Retention field in the Account Statement Cycling Control Settings determines how long statements remain in the history file. The End-of-Month process purges the Statement History File. Use the Reprint Statements option to reprint statements from the Statement History File.

Reprint Statements Reprint Statements

To use this routine to re-print customer statements from the History file, check this box. To use this routine to print new customer statements, leave this field blank.

Statement Type Statement Type

If printing new customer statements, choose from the following:

To Print: Click on:
all Statements All
all statements not considered "hold" Statements Regular
all "hold" statements Hold

Statements are classified as "hold" when:

The Hold Statement filed in the Customer Settings is active.

The Hold Credit Balance Statements field in the Account Statement Cycling Control Settings is active.

If you select All, the system prints both regular and hold statements in the following sequence:

Hold-customer statements ("Hold Statement" is active)

Hold-credit statements

Regular statements

A separator page prints at the completion of each type of statement.

Customer Customer

Enter the code of the customer for which you want to re-print statements. If you click on the Search button, you access the Search for a Customer screen, from which you can select a customer code.

Statement Month Statement Month

Enter the month for which you want to reprint statements. Otherwise, leave the field blank to re-print statements for all months.

Statement Day Statement Day

Enter the day for which you want to reprint statements. Otherwise, leave the field blank to re-print statements for all days.

Statement Year Statement Year

Enter the year for which you want to reprint statements. Otherwise, leave the field blank to re-print statements for all years.

After you specify your print preferences, click Run to send the report to your output device.

NOTE: If you have selected "Forms" at the Statement Form field in the A/R Statement Cycling Control Settings, the system asks you to load and test-print a form each time you print. If you choose "Laser", the system sends the report directly to the laser printer.

If you use "Forms" as your print method for customer statements, you can modify your print form to include "RE-PRINT" on all customer statements that you have already printed.

Send Output to Send Output to

The output destination of the report displays. To change the output destination, click on the Actions button and select Output Settings.

Export Path Export Path

If you select NFS as your output option, this field displays the user-defined network path-name specified in the Account Statement Cycling Control Settings, as well as the filename specified in the Output Settings screen. Note that you cannot edit the export path using this process.

Actions

Once the run-time options have been selected, choose Run to produce the report.

To generate statements in XML format, select NFS as your output option. The Output Settings option is available from the Actions button only if the Create XML for Open Item Statements and Export To field is enabled on the Advanced tab of the Account Statement Cycling Control Settings.
