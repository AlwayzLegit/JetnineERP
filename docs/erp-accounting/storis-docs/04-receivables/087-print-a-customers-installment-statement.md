---
title: Print a Customer's Installment Statement
article_id: 15202279027220
section: 04-receivables
index: 87
url: https://storis.zendesk.com/hc/en-us/articles/15202279027220-Print-a-Customer-s-Installment-Statement
source: STORIS Help Center (storis.zendesk.com)
---

Access

Accounting > Installment > Installment Statements > Print a Customer's Installment Statement

Use this routine to print new installment customer statements or reprint installment statements that were moved to history. For new statements, the program uses the customer information created in the Cycle Process during End-of-Day processing. You can print All, Regular, or Hold statements.

Following the printing of regular statements, the statements move to history. If you do not print regular statements, they move to history during the next customer cycle process. That is, before the cycle process creates statements, any existing statements not yet printed move to history. The Statement History Retention field in the Account Statement Cycling Control Settings determines how long statements remain in history. The End-of-Month process purges the Statement History File. Use the Reprint Statements option to reprint statements from the Statement History File.

NOTE: In order to run this routine, you must have the Statement Form field in your Account Statement Cycling Control Settings set to Forms Designer.

Reprint Statements Reprint Statements

To use this routine to reprint customer statements from history, check this box. The Customer Code, and Statement Month, Day, and Year become active. To use this routine to print new customer statements, leave this field blank.

Statement Type Statement Type

If printing new customer statements, choose from the following:

All - Select this option to print both regular and hold statements. A separator page prints at the completion of each type of statement. The statements print in the following sequence:

Customer statements on Hold (see Hold below)

Credit balance statements on Hold (see Hold below)

Regular statements

Regular - Select this option to print statements that are not considered hold statements.

Hold - Select this option to print all hold statements. Statements are classified as "hold" when:

The Hold Customer's Statement field in the Advanced Customer Settings is set to Yes or Blank.

and/or

The Hold Credit Balance Statements field in the Account Statement Cycling Control Settings is active.

If you checked the box at Reprint Statements, the following four fields are active.

Customer Code Customer Code

To reprint statements for a specific customer, enter the customer code. If you click on the Search button, you access the Search for a Customer screen, where you can search for a customer code. To reprint statements for all installment customers, leave this field blank.

Contract Number Contract Number

This field is active if the Reprint Statements box is checked and you have indicated a customer code. Enter the installment contract number for which you are re-printing a statement.

Statement Month Statement Month

Enter the month for which you want to reprint statements. Otherwise, leave the field blank to reprint statements for all months.

Statement Day Statement Day

Enter the day for which you want to reprint statements. Otherwise, leave the field blank to reprint statements for all days.

Statement Year Statement Year

Enter the year for which you want to reprint statements. Otherwise, leave the field blank to reprint statements for all years.

Send Output to Send Output to

The output destination of the report displays. To change the output destination, click on the Actions button and select Output Options.

Export Path Export Path

If you select NFS as your output option, this field displays the user-defined network path-name specified in the Account Statement Cycling Control Settings, as well as the filename specified in the Output Options screen. Note that you cannot edit the export path using this process.

Actions

NOTE: Once the run-time options have been selected, choose Run to produce the statements.

You can modify your print form to include "RE-PRINT" on all customer statements that you are re-printing.

To generate statements in XML format, select NFS as your output option. Output Options is available from the Actions button only if the Create XML for Installment Statements and Export To field is enabled on the Advanced tab of the Account Statement Cycling Control Settings.
