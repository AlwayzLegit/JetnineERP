---
title: Bank Check File Format - Standard NACHA Format
article_id: 22935273569172
section: 03-payables
index: 13
url: https://storis.zendesk.com/hc/en-us/articles/22935273569172-Bank-Check-File-Format-Standard-NACHA-Format
source: STORIS Help Center (storis.zendesk.com)
---

If using the "positive pay" feature, the Create Bank Check File process creates a comma separated text file in the following format.

Contents

Number of Characters

Format

Mandatory or Optional

Data Validation

Check Number

10

numeric only

mandatory

10 or fewer numeric characters only.
Check Issue Date

10

mm/dd/yyyy

mandatory

The date the check was issued. Month (mm) may be entered as single or double digit values. Valid single digit month values are 1 through 9. Valid double digit month values are 10 through 12. Day (dd) may be entered as single or double digit values. Valid single digit day values are 1 through 9. Valid double digit day values are 10 through 31. Year (yyyy) may be entered as double or four digit values. Value "12" will be treated as "2012" for yyyy. Slashes must be used as separators to separate mm from dd from yyyy.
Check Amount

11

0 to 99999999.99

mandatory

Eight or fewer numeric characters to the left of the decimal place. Two or fewer numeric characters to the right of the decimal place. Negative signs are ignored. The decimal point is optional.
Bank Number

3

numeric only

mandatory

One to 3 numeric characters only. These can be the same 3 digit bank numbers associated with the account currently.
Account Number

10

numeric only

mandatory

10 or fewer numeric characters only.
Transaction Code

2

specific codes

mandatory

IA = Insert Add

ID = Insert Delete

VA = Void Add

VD = Void Delete
Payee

128

alphanumeric, no commas

optional

Reference

20

alphanumeric, no commas
