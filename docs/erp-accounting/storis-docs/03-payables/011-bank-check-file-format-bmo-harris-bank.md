---
title: Bank Check File Format - BMO Harris Bank
article_id: 15202012411668
section: 03-payables
index: 11
url: https://storis.zendesk.com/hc/en-us/articles/15202012411668-Bank-Check-File-Format-BMO-Harris-Bank
source: STORIS Help Center (storis.zendesk.com)
---

If using the "positive pay" feature and BMO Harris Bank is your bank, the Create Bank Check File process creates a comma separated text file in the following format.

Contents

Number of Characters

Format

Mandatory or Optional

Data Validation

Check Number

10

numeric only

mandatory

10 or fewer numeric characters only. If fewer than 10 characters entered, BMO Harris Bank will pad the number with leading zeroes.
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

One to 3 numeric characters only. These can be the same 3 digit bank numbers associated with the account currently. If fewer than three characters are entered, BMO Harris Bank will pad the number with leading zeroes.
Account Number

10

numeric only

mandatory

10 or fewer numeric characters only. If fewer than 10 characters are entered, padding of leading zeroes will be applied by BMO Harris Bank.
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
