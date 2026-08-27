---
title: Life Of The South (LOTS) Insurance File Layouts
article_id: 27276845605268
section: 04-receivables
index: 63
url: https://storis.zendesk.com/hc/en-us/articles/27276845605268-Life-Of-The-South-LOTS-Insurance-File-Layouts
source: STORIS Help Center (storis.zendesk.com)
---

The following templates are used for the Life Of The South (LOTS) Insurance.

Insurance Enrollment

Field Name Length Type Description
ENTRAN 2 Alpha numeric Transaction Type – ‘01’
ENCUST 16 Alphanumeric The Customer ID, left justified, space filled
ENINSURER 2 Alpha numeric Insurer – ‘AF’
ENPRODUCER 8 Alpha numeric Store ID, space filled
ENFILL1 3 Filler Spaces
ENSTATE 2 Alphanumeric The state for the store that the customer is assigned to
ENEFDT 6 Numeric Plan open date – MMDDYY
ENFILL2 3 Filler Spaces
ENRESPTYPE 8 Filler Spaces
ENFILL3 2 Filler Spaces
ENPOLICYFRM 8 Filler Spaces
ENCOVPLAN 3 Filler Spaces
ENFILL4 31 Filler Spaces
ENPRMLNAM 15 Alphanumeric Customer Last Name, left justified, space filled
ENPRMFNAM 10 Alphanumeric Customer First Name, left justified, space filled
ENPRMINIT 1 Alphanumeric Customer Middle initial
ENPRMDOB 6 Numeric Customer Date of Birth MMDDYY
ENPRMSEX 1 Alphanumeric “M”, “F” or null
ENFILL5 9 Filler Spaces
ENSECLNAM 15 Alphanumeric CoApplicant Last Name, left justified, space filled
ENSECFNAM 10 Alphanumeric CoApplicant Fist Name, left justified, space filled
ENSECINIT 1 Alphanumeric CoApplicant Middle Initial
ENSECDOB 6 Numeric CoApplicant Date of Birth MMDDYY
ENSECSEX 1 Alphanumeric “M”, “F” or null
ENFILL6 9 Filler Spaces
ENADDR1 40 Alphanumeric Customer street address 1
ENADDR2 40 Alphanumeric Customer street address 2
ENFILL7 40 Filler Spaces
ENCITY 38 Alphanumeric Customer city
ENBSTATE 2 Alphanumeric Customer state
ENZIP 5 Alphanumeric Customer Zip Code
ENZIP4 4 Alphanumeric Customer Zip +4
ENFILL8 118 Filler Spaces
ENDEBTTYPE 7 Filler Spaces
ENFILL9 128 Filler Spaces
ENRCVDT 6 Filler Spaces

Premium Enrollment

Field Name Length Type Description
EMTRAN 2 Alpha numeric Transaction Type – ‘01’
EMPRODUCER 8 Alpha numeric Store ID, space filled
EMLOANACT 6 Numeric The number of active revolving plans that were assessed insurance during the cycle period
EMMNTHDT 6 Numeric The first day of the calendar month that the cycle date occurs within. For example, if the cycle date is 5/5, a date of 5/1 will be reported. Likewise if the cycle date is 5/26, a date of 5/1 will be reported. NOTE: this is NOT the date of the beginning of the cycle.
EMPOLCYFRM 8 Filler Spaces
EMAVEBAL 9(7)V99 Numeric The sum of the average daily balance for all accounts with this insurance code(s) for the cycle period.
EMPREM 9(5)V99 Numeric The sum of the insurance premiums assessed for this insurance code(s)
EMFILLER 34 Filler Spaces
EMRCVDT 6 Filler Spaces
