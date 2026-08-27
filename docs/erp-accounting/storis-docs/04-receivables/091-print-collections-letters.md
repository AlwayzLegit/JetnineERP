---
title: Print Collections Letters
article_id: 15202310010900
section: 04-receivables
index: 91
url: https://storis.zendesk.com/hc/en-us/articles/15202310010900-Print-Collections-Letters
source: STORIS Help Center (storis.zendesk.com)
---

Access

Accounting > Collections > Print Documents > Print Collections Letters

Use this routine to print Collections letters.

If generating collections letters via an export file, the system creates an Excel ® spreadsheet containing one column for each of the below pieces of information and one row for each customer. You can then use the spreadsheet to perform a mail-merge or import it into an external process to generate letters.

If generating collections Letters via the Enhanced Laser Printing, the system creates the XML code for the collections letters.

NOTE: You can also print Collections letters via the Assign and Print Collections Letters routine.

District District

Enter the code of the district (if any) whose customer's Collections letters you want to print. If you click on the Arrow, a list of districts appears from which you can choose. If you click on the Action button, the Multiple District Selection Window appears from which you can select one or more. If you leave the field blank, you select all districts.

This field is active only if

the District field is enabled in the Collections Processing Control Settings, and

Regional Processing is active on your system.

Note that if you enter a response at this field, you inactivate the Store Location field.

Store Location Store Location

Enter the code of the location (if any) whose customer's Collections letters you want to print. If you click on the Arrow, a list of stores appears from which you can choose. If you click on the Action button, the Multiple Location Selection Window appears from which you can select one or more. If you leave the field blank, you select all locations.

NOTE:If you enter a response at this field, you inactivate the District field. This field is active only if the Location field is enabled in the Collections Processing Control Settings.

Collector Collector

Enter the code of the collector whose collections letters you want to print. If you click on the Action button, the Multiple Selection Lookup Window appears from which you can select one or more. If you leave the field blank, you select all collections.

Letter Letter

Click the Arrow button and select the collection letter you want to generate.

Name of File Name of File

Enter the name of the file in which to store the generated letters. The name you enter must be a valid Windows ® file name and extension. This field is active only if your system is set to generate Collections letters via an export file (that is, Export Letter is selected at the Collections Letter field in the Collections Processing Control Settings).

Path to File Path to File

Enter the full path name (drive + path, with appropriate delimiters or properly formatted UNC path) to which to write the file specified above. This field is active only if your system is set to generate Collections letters via an export file (that is, Export Letter is selected at the Collections Letter field in the Collections Processing Control Settings).

Examples

C:\Folder1\Folder2

\\servername\folder1\folder2

For each letter, the program passes the following information to the export file or to the Forms Designer:

Customer Name

Cosigner Employer

Address Line 1

Long Term Revolving Balance

Address Line 2

Open Item Balance

City

Total Account Balance

State

Current Due

Zip Code

Past Due 1 to 30

Home Telephone Number

Past Due 31 to 60

Work Telephone Number

Past Due 61 to 90

Cell Phone

Past Due 91 to 120

Email Address

Past Due Finance Fees

Credit Limit

Past Due Insurance

Occupation

Past Due Interest

Employer

Past Due Late Fees

Employer Address1

Past Due Principal

Employer Address 2

Last Payment Amount

Co-Applicant Name

Last Payment Date

Co-Applicant Employer

Last Purchase Amount

Cosigner

Last Purchase Date

Cosigner Address 1

Promise to Pay Date

Cosigner Address 2

Promise to Pay Amount

Cosigner Occupation
