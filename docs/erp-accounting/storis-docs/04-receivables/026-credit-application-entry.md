---
title: Credit Application Entry
article_id: 15202310374292
section: 04-receivables
index: 26
url: https://storis.zendesk.com/hc/en-us/articles/15202310374292-Credit-Application-Entry
source: STORIS Help Center (storis.zendesk.com)
---

Access

Request Credit Information Routine, via the Next button or the Actions button

Credit Request Review Screen, click the Update a Credit Application button

Tabs: Personal, Residence, Employment, Reference, Miscellaneous

Use this routine to enter or update a credit application for a customer. This screen is accessed via the Request Credit Information routine, in which you specify the customer applying for credit. You can also access this screen via the Credit Request Review Screen. Information on the specified customer appears in the header area of this screen. Use the Personal, Residence, Employment, Reference, and Miscellaneous tabs to collect information for the primary applicant, and also for the co-applicant/co-signer, if any.

NOTE: This program displays customer information as it appeared at the time the application was entered into the system. If you re-access an application and the customer's record in the Customer Settings was updated in the meantime, the application does not reflect the changes.

This process generates credit request comments each time you create a credit application or access an existing one.

When entering a credit application, the system prevents you from entering a date more than 100 years in the past.

You can access this screen via the Enter a Sales Order process but you cannot access the sales order process from this screen.

Header Area

The header area contains information on the selected applicant, co-applicant, or co-signer. The same information appears in the header area of each tab in the routine, and you cannot edit this information within this routine.

Customer Number, Name, Address Customer Number, Name, Address

The customer code, name, and address display from the Request Credit Information routine.

Personal

Depending on your Credit Application Control Settings, your entry in each of the following fields is optional, mandatory, or can be skipped (not needed).

Social Security #, Social Insurance # Social Security #, Social Insurance #

The field label "Social Security #" displays when processing with the United States as your "home" country, or displays "Social Insurance #" when processing with Canada as your domestic country.

Enter the applicant's social security/insurance number. You must specify a 9-digit number. Note that this program does not display the entry as a masked number.

Date of Birth Date of Birth

Enter the applicant's date of birth. If the age of the applicant calculates to less than 18 years, a warning message appears and you must enter a different date.

Driver's License Driver's License

Enter the applicant's driver license number. You can enter up to 25 alphanumeric characters.

Gender Gender

Use this field to specify the gender of the applicant. If you click on the Arrow button, a list of options appears.

Marital Status Marital Status

Use this field to specify the marital status of the applicant. If you click on the Arrow button, a list of options appears.

Additional Applicant

Use these fields to indicate if you are entering/maintaining an application for additional applicants.

Co-applicantCo-applicant

Check the box to indicate that an additional person is applying for credit and both parties are equally responsible for payment. If you check this box, the Co-applicant button becomes active.

NOTE: Click the button to access the Personal, Residence, Employment, Miscellaneous, and Reference tabs, where you can enter information for the additional applicant. The Co-Applicant Name and Address Maintenance window displays.

If the box is checked and you un-check it, a verification prompt asks if you are sure you want to delete the co-applicant information. In addition, if information was previously entered for the co-applicant, you are prompted to enter the reason for the deletion.

Co-signer Co-signer

Check the box to indicate that an additional person is participating in the application and agrees to assume responsibility for repayment in the event that the borrower fails to repay. If you check this box, the Co-signer button becomes active.

NOTE: To access the Personal, Residence, Employment, Miscellaneous, and Reference tabs for the person who is co-signing this application, click this button.

If the box is checked and you un-check it, a verification prompt asks if you are sure you want to delete the co-signer information. In addition, if information was previously entered for the co-signer, you are prompted to enter the reason for the deletion.

NOTE: When a co-applicant or co-signer is removed from the credit application all financed sales orders are placed on C4 credit hold.

The following applies if the "Customer Entry - Warn if Primary Email exists for other Customers" setting is checked in the Customer tab of Point of Sale Control Settings: If an email address is added or changed, the new email address is checked to determine if it has been assigned to any other customer account as a primary email address. If the email address already exists, a warning message appears that can be dismissed.

Checking Checking

To indicate the customer has a checking account, check the box at this field. Otherwise, leave the field blank.

Savings Savings

To indicate the customer has a savings account, check the box at this field. Otherwise, leave the field blank.

# of Dependents # of Dependents

Enter the number dependents for the applicant. You can enter any number from 0 to 99.

Email Email

Enter the applicant's e-mail address. You can enter up to 50 alphanumeric characters. Your entry must conform to the standard e-mail format (XX@XX.XX).

The following applies if the "Customer Entry - Warn if Primary Email exists for other Customers" setting is checked in the Customer tab of Point of Sale Control Settings: If an email address is added or changed, the new email address is checked to determine if it has been assigned to any other customer account as a primary email address. If the email address already exists, a warning message appears that can be dismissed.

ActionsActions

Add Attachments

View Attachments

Edit Attachments

Co-Applicant Name and Address Maintenance (Co-Applicant tabs only)

NOTE: You can only edit files attached to the credit application. You can view attachments linked to the primary applicant’s Customer Settings and credit application.

A paperclip icon displays next to the Help button. If file attachments exist for the primary applicant’s customer record and/or credit application, the icon appears in bold. Otherwise, the icon is inactive (dimmed).

If you have access to the credit application process and the Receivables Staff Security, Access credit applications and score reporting , is checked, you can add an attachment using the Add Attachment extra action while the credit request has the status of hold or pending. If the receivables setting is unchecked (as for sales personnel), the View Credit Request Responses process allows you to add, view, and edit attachments incase an underwriter needs additional information to make their decision.

Residence

Depending on your Credit Application Control Settings, your entry in each of the following fields is optional, mandatory, or can be skipped (not needed).

Current

TypeType

Select the type of residence. You have the following options:

None Selected

Own

Rent

Other

Home Phone, Cell PhoneHome Phone, Cell Phone

The applicant's home phone and cell phone numbers display. These are defaulted from the customer record but can be overridden here. Upon saving the credit application, the customer record is updated with this information and the Customer Activity Log is updated as well.

Resided Since Resided Since

Enter the date on which the applicant began living at their current residence.

Mortgage Company/Landlord Mortgage Company/Landlord

Use this field to enter the name of the mortgage company or landlord to whom this applicant's current mortgage/rent is paid.

Mortgage Balance Mortgage Balance

Enter the applicant's mortgage balance. You can enter any whole dollar amount greater than or equal to zero, with a maximum of 8 digits, no decimal.

HomeHome

Value Enter the value of the applicant's home. You can enter any whole dollar amount greater than or equal to zero with a maximum of 8 digits, no decimal.

Monthly Payment Monthly Payment

Enter the applicant's monthly mortgage payment. You can enter any whole dollar amount greater than or equal to zero with a maximum of 8 digits, no decimal.

Previous

Address 1 Address 1

Enter the address of the applicant's previous residence (if any). You can enter up to 30 alphanumeric characters.

Address 2 Address 2

Enter the address of the applicant's previous residence (if any). You can enter up to 30 alphanumeric characters in addition to the characters you entered in the Address 1 field.

Zip Code Zip Code

Enter the zip code of the applicant's previous residence (if any). You can enter up to 9 characters. If the zip code you enter exists in the system, the associated city and state default. If the zip code you enter does not exist in the system, a warning message appears but you can proceed. Note that you cannot use this screen to create new zip codes.

City City

Enter the city of the applicant's previous residence (if any). You can enter up to 20 alphanumeric characters.

State State

Enter the two-character state abbreviation of the applicant's previous residence (if any).

Resided FromResided From

Enter the date on which the applicant began living at their previous residence.

To Enter the date on which the applicant ceased living at their previous residence. The date you enter here must be equal to or greater than the Resided From date.

Actions

Customer Maintenance (primary applicant only)

Employment

Depending on your Credit Application Control Settings, your entry in each of the following fields is optional, mandatory, or can be skipped (not needed).

Current

StatusStatus

Use this field to indicate the employment status of the applicant. Click the Arrow button and select the status from the drop-down list. Depending on the Credit Employment Status Settings for the selected status and your Credit Application Control Settings, entry in the fields on the Employment tab of the application may be required.

Job Job

Title Enter the applicant's job title. You can enter up to 25 alphanumeric characters.

Employer Employer

Enter the name of the applicant's employer. You can enter up to 30 alphanumeric characters.

Address 1 Address 1

Enter the first address line of the applicant's employer. You can enter up to 30 alphanumeric characters.

Address 2 Address 2

Enter the second address line of the applicant's employer. You can enter up to 30 alphanumeric characters in addition to the characters you entered in the Address 1 field.

Zip Code Zip Code

Enter the zip code of the applicant's employer. You can enter up to 9 characters. If the zip code you enter exists in the system, the associated city and state default. If the zip code you enter does not exist in the system, a warning message appears but you can proceed. Note that you cannot use this screen to create new zip codes.

City City

Enter the city of the applicant's employer. You can enter up to 20 alphanumeric characters.

State State

Enter the two-character state abbreviation of the applicant's employer.

Phone Phone

Enter the phone number of the applicant's employer. You must enter 10 numeric characters.

Employment Employment

Date Enter the date on which the applicant began working at their current job.

Income Income

Enter the applicant's income. You can enter any whole dollar amount greater than or equal to zero with a maximum of 8 digits, no decimal.

Income Indicator Income Indicator

Enter the frequency at which the applicant receives the income amount specified at the Income field. You have the following options:

Monthly

Annually

Previous

Job Title Job Title

Enter the applicant's previous job title. You can enter up to 25 alphanumeric characters.

Employer Employer

Enter the name of the applicant's previous employer. You can enter up to 30 alphanumeric characters.

Address 1 Address 1

Enter the address of the applicant's previous employer. You can enter up to 30 alphanumeric characters.

Address 2 Address 2

Enter the address of the applicant's previous employer. You can enter up to 30 alphanumeric characters in addition to the characters you entered in the Address 1 field.

Zip Code Zip Code

Enter the zip code of the applicant's previous employer. You can enter up to 9 characters. If the zip code you enter exists in the system, the associated city and state default. If the zip code you enter does not exist in the system, a warning message appears but you can proceed. Note that you cannot use this screen to create new zip codes.

City City

Enter the city of the applicant's previous employer. You can enter up to 20 alphanumeric characters.

State State

Enter the two-character state abbreviation of the applicant's previous employer.

Phone Phone

Enter the phone number of the applicant's previous employer. You must enter 10 numeric characters.

Employed FromEmployed From

Enter the date on which the applicant began working for their previous employer.

To Enter the date on which the applicant ceased working for their previous employer. The date you enter here must be equal to or greater than the Employed From date.

Reference

Use this tab to enter information for the applicant's references. You can enter up to 99 references.

Name Name

Enter the name of the applicant's credit reference. You can enter up to 30 alphanumeric characters.

Type Type

Enter text describing the type of reference being entered, for example, Personal, Business, etc. You can enter up to 15 alphanumeric characters.

Phone Phone

Enter the phone number of the applicant's credit reference. You must enter 10 numeric characters.

Address 1 Address 1

Enter the address of the applicant's credit reference. You can enter up to 30 alphanumeric characters.

Address 2 Address 2

Enter the address of the applicant's credit reference. You can enter up to 30 alphanumeric characters in addition to the characters you entered in the Address 1 field.

Zip Code Zip Code

Enter the zip code of the applicant's credit reference. You can enter up to 9 characters. If the zip code you enter exists in the system, the associated city and state default. If the zip code you enter does not exist in the system, a warning message appears but you can proceed. Note that you cannot use this screen to create new zip codes.

City City

Enter the city of the applicant's previous employer. You can enter up to 20 alphanumeric characters.

State State

Enter the two-character state abbreviation of the applicant's previous employer.

After you enter information for each reference, click the Add button to update the grid. The grid displays the Name, Type, and Phone number of each reference added.

Miscellaneous

Use this tab to enter miscellaneous information on the applicant, including the applicant's military service (if any).

Rank Rank

Enter the applicant's military rank. You can enter up to 20 alphanumeric characters.

Branch Branch

Enter the applicant's branch of service. You can enter up to 20 alphanumeric characters.

Service Comp Date Service Comp Date

Enter the date on which the applicant began their military service.

ETS Date ETS Date

Enter the date that the applicant's service in the military ended (that is, estimated time of separation (ETS)).

Commanding Officer

Name Name

Enter the name of the applicant's commanding officer. You can enter up to 30 alphanumeric characters.

Phone Phone

Enter the phone number of the applicant's commanding officer. You must enter 10 numeric characters.

When you finish entering the application information, click the Save button to process this credit request. If you are set up to transmit to the credit bureau, the program sends the application data to the bureau for the purposes of obtaining a credit report.
