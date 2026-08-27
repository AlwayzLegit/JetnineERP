---
title: Central States Indemnity Co (CSI) Insurance File Layout
article_id: 46698242097940
section: 04-receivables
index: 17
url: https://storis.zendesk.com/hc/en-us/articles/46698242097940-Central-States-Indemnity-Co-CSI-Insurance-File-Layout
source: STORIS Help Center (storis.zendesk.com)
---

Field Name Length Begin Position End Position Description

Fields that need to be populated for enrollment

Transaction Code 2 1 2 01=Issue Transaction
Account Number 16 3 18
Primary Insured Last Name 20 19 38
Primary Insured First Name 15 39 53
Primary Insured Middle Initial 1 54 54
Primary Insured DOB 8 55 62 YYYYMMDD
Secondary Insured Last Name 20 63 82 Provide when applicable
Secondary Insured First Name 15 83 97 Provide when applicable
Secondary Insured Middle Initial 1 98 98 Problem when applicable
Secondary Insured DOB 8 99 106 YYYYMMDD
Address Line 1 30 107 136
Address Line 2 30 137 166
City 20 167 186
State 2 187 188
Zip Code (plus 4) 9 189 197 123456789
Phone Number 10 198 207 1234567890
Insurance Effective Date 8 208 215 YYYYMMDD
Enrollment Identifier 12 216 227 Unique code for each enrollment type

Fields that need to be populated for Cancels

Transaction Code 2 1 2 02=Cancel Transaction
Account Number 16 3 18
Primary Insured Last Name 20 19 38
Primary Insured First Name 15 39 53
Primary Insured Middle Initial 1 54 54
Cancellation Effective Date 8 55 62 YYYYMMDD
Cancel Reason Code 2 63 64 Unique Code for Cancel Reason
Filler 163 65 227

Notes:

Record Length: 227
File Type = Fixed Length Text File - No Tab Delimiters or Quotation Marks
Include only one carriage return at the end of each record
Enrollment Records should only include customers who are eligible for the insurance
The Enrollment Identifier needs to be unique for each enrollment type
Enrollment Identifier Examples
P (Paper Application)
C (Card Carrier)
Cancel Reason Code Examples
DL (Delinquent Cancel)
CL (Closed Account)
