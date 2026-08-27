---
title: Bank Check File Format - Bank of America
article_id: 15202012591252
section: 03-payables
index: 6
url: https://storis.zendesk.com/hc/en-us/articles/15202012591252-Bank-Check-File-Format-Bank-of-America
source: STORIS Help Center (storis.zendesk.com)
---

If using the "positive pay" feature and Bank of America is your bank, the following displays the format of the bank check file.

Header Record:

Field

Position

Length

Comment

Sample Value

Bank ID

1-8

8

Bank Identifier from BANK record NOTE: This is a new field. If the Bank Identifier is null the Bank Code will be used. This field will be left justified and zero filled.

DRS35500

Account Number

9-10

10

Account number from BANK record

1463500422

Process Year

19-22

4

Check year

2009

Process Month

23-24

2

Check month

10

Process Day

25-26

2

Check day

06

Detail Record:

Field

Position

Length

Comment

Sample Value

Check Number

1-10

10

Check number right justified, zero filled.

0000110870

Check Amount

11-20

10

Check amount. Right justified, zero filled, implied 2 decimal places.

0000152000

Account Number

21-30

10

Account number from BANK file

1463500422

Check Month

31-32

2

Check month (MM)

10

Check Day

33-34

2

Check day (DD)

06

Check Year

35-36

2

Check year (YY)

09

Space

37-37

1

Filler

Spaces

Payee

38-80

43

Payee or remit-to name, NOT vendor name

AC PACIFIC CORPORATION

Footer Record:

Field

Position

Length

Comment

Sample Value

Start Count

1-1

1

Always '1'

1

EOF

2-4

3

Always 'EOF'

EOF

Space

5-5

1

Filler

Spaces

Count of Checks

6-10

5

Right justified, zero filled

00002

Space

11-30

20

Filler

Spaces

Check Number Check Figure

31-40

10

Summation of check numbers. Right justified zero filled

0000221741

Check Amount Check Figure

41-50

10

Summation of check amounts. Right justified, zero filled, implied two decimal places

0000166819
