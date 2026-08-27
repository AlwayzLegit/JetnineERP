---
title: Create Bank Check File
article_id: 15202012945556
section: 03-payables
index: 21
url: https://storis.zendesk.com/hc/en-us/articles/15202012945556-Create-Bank-Check-File
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > Payables > Process Checks > Create Bank Check File

Use this routine to create "positive pay" bank check files for use in preventing fraud caused by altered checks. You can then transmit the field to your bank using the method of your choice. The program includes only checks printed in a check run and excludes all others, for example electronically transmitted checks.

STORIS supports the following bank check file formats:

Bank of America

Bank of Montreal

Bank of Montreal Enhanced

Bank of Montreal Enhanced 2

BB&T Bank

BMO Harris Bank

Chase

SunTrust Bank

The Private Bank

US Bank

Wachovia

Wells-Fargo

Depending on the selected bank's requirements, the program creates either an ASCII text file (.txt) or an Excel® spreadsheet file (.csv) containing basic information about printed checks such as the check number, amount, and payee.

Bank Bank

Enter the code of the bank for which to create a bank check file. If you click on the Arrow, a list of banks appears from which you can choose. The list includes only banks for which "positive pay" has been established via the Positive Pay File Format field in the Bank Settings. STORIS creates the bank check file based on specifications from the bank, using one of the following formats:

Bank of America - ASCII

Bank of Montreal

BMO Harris Bank

Chase – ASCII

The Private Bank - fixed-length file

US Bank - ASCII fixed-length text file

US Bank (II) - comma-delimited text file

Wachovia – ASCII

Wells Fargo - .CSV

Date Code Date CodeClick on the Arrow button to view a list of date codes, then select the code that best indicates the time period on which to base your report.

Check Date Check DateIf you enter Custom at the Date Code field, use this field to enter the date for which you want to create a bank check file. If you click on the Calendar Icon, a calendar appears which you can use to select a date. If you choose Today or Yesterday at the Date Code field, that date defaults.

Include Checks Already Transmitted Include Checks Already TransmittedTo transmit all checks for the selected bank and check date, including checks previously transmitted via this routine, check the box. To transmit only non-transmitted checks, leave the box blank.

Send Output to Send Output toThe output destination of the report displays based on your selection at the Bank field. If you click on the Actions button and select Output Settings, you can edit the file name but not the path.

Export Path Export PathThis field displays the pre-set computer drive and folder location to which the system exports the report data. You cannot edit the export path using this process.

Test Mode Test ModeSelecting this check box will export the data in a test mode, while deselecting it will produce live data.

This control will only be active if the Positive Pay File Format, in Bank Settings on the EFT and Positive Pay tab, allows for test mode, which will only be Bank of Montreal's format.

ActionsActions

Output Settings
