---
title: Create Insurance Enrollment File
article_id: 15202312123284
section: 04-receivables
index: 24
url: https://storis.zendesk.com/hc/en-us/articles/15202312123284-Create-Insurance-Enrollment-File
source: STORIS Help Center (storis.zendesk.com)
---

Access

Accounting > Revolving Receivables > Revolving Views and Reports > Revolving Reports > Insurance Enrollment File Creation

Use this routine to generate insurance enrollment files. This file contains information on

newly created revolving plans with insurance or

existing revolving plans to which insurance has been added.

Enrollment File Creation

If you leave the Recreate File box blank, the program selects all active revolving plans for the specified insurance code that have not already been reported. The plans update with the date on which they were reported to the insurance company.

If you check the box at the Recreate File field, the program selects all active revolving plans for the specified insurance code that were originally reported within the specified date range.

The program creates the insurance enrollment file as a fixed-length ASCII file.

If PREM is selected in the Insurance File Format in Revolving Receivables Control Settings, the file produced by this process when you hit "Run" is in the Premier Insurance layout.

Insurance Code Insurance Code

Enter the code of the insurance for which to generate an insurance enrollment file. If you click on the Arrow, a list of insurances appears from which you can choose one or more. If you click on the Action button, a Multiple Selection Lookup Window appears from which you can choose one or more. If you leave the field blank, you select all insurances.

Recreate File Recreate File

To generate a new insurance enrollment file, check the box at this field. To generate a file for a previous date, leave the box blank.

Start Date Start Date

If you check the box at the Recreate File field, this field activates and you can specify a date range using this field and the End Date field. If you click on the Calendar Icon, a calendar appears from which you can select a date.

End Date End Date

If you check the box at the Recreate File field, this field activates and you can specify a date range using this field and the Start Date field. If you click on the Calendar Icon, a calendar appears from which you can select a date.

Send Output to Send Output to

The output destination of the report displays. Note that the only output destination for this routine is ASCII Export.

Export Path Export Path

The user’s default export path and file name displays. If you update the File Name field, the file name in the Export Path updates accordingly.

Actions

Output Settings - This option is inactive in this routine.
