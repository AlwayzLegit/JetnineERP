---
title: Assign and Print Collections Letters
article_id: 15202310014484
section: 04-receivables
index: 10
url: https://storis.zendesk.com/hc/en-us/articles/15202310014484-Assign-and-Print-Collections-Letters
source: STORIS Help Center (storis.zendesk.com)
---

Access

Accounting > Collections > Print Documents > Assign and Print Collection Letters

Use this routine to mass-produce Collections letters for past-due customers who qualify for Collections. The program

selects customers based on criteria you specify in this routine and

assigns a user-defined collections letter to them.

NOTE: For customers with letters already assigned to them, this process assigns the letters you specify here and does not overwrite the existing assignments.

For letters you generate here, the system updates the Collector statistics file and posts comments to the Collector Comments file.

If generating collections letters via export file, the system creates an Excel ® spreadsheet containing one column for each of the below pieces of information and one row for each customer. You can then use the spreadsheet to perform a mail-merge or import it into an external process to generate letters.

If generating collections Letters via the Enhanced Laser Printing, the system creates the XML code for the collections letters.

You can also print Collections letters via the Print Collections Letters routine.

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

Enter the code of the collector whose collections letters you want to print. If you click on the Search button, the Multiple Selection Lookup Window appears from which you can select one or more. If you leave the field blank, you select all collections.

Past Due Days

In these mandatory fields you specify a range of past-due days. The process then selects customers for collection letters whose past-due days fall within that range.

From From

Enter the initial day in the range of past-due days. Enter a number between 1 and 9999. The number you enter here cannot be greater than the number in the To field. Customers whose past-due days fall within the range you specify using this field and the To field are selected.

To To

Enter the final day in the range of past-due days. Enter a number between 1 and 9999. The number you enter here cannot be less than the number in the From field. Customers whose past-due days fall within the range you specify using this field and the To field are selected.

Past Due $

In these optional fields you specify a range of past-due amounts. The process then selects customers for collection letters whose past-due amount falls within that range.

Minimum Past Due $ Minimum Past Due $

To select customers based on a range of past-due amounts, enter the minimum past-due dollar amount (if any) here. Customers whose past-due amount exceeds this amount are selected.

Maximum Past Due $ Maximum Past Due $

To select customers based on a range of past-due amounts, enter the maximum past-due dollar amount (if any) here. Customers whose past-due amount is less than this amount are selected.

Letter Letter

Click the Arrow button and select the collection letter you want to generate.

Print Now Print Now

To generate letters immediately, check the box at the field. Otherwise, leave the field blank. This field is inactive until you specify a letter at the Letter field.

If you check the box at the field, the system checks the Collection Letters field in the Collections Processing Control Settings screen to determine the type of file to output and then generates the letters when you click on Run.

Name of File Name of File

Enter the name of the file in which to store the generated letters. The name you enter must be a valid Windows ® file name and extension. This field is active only if your system is set to generate Collections letters via an export file (that is, Export Letter is selected at the Collections Letter field in the Collections Processing Control Settings).

Path to File Path to File

The path to the file where the generated letters are to be stored is displayed. You cannot edit this field.

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
