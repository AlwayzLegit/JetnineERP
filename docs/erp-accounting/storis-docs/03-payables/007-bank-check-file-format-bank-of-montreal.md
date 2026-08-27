---
title: Bank Check File Format - Bank of Montreal
article_id: 15202010925332
section: 03-payables
index: 7
url: https://storis.zendesk.com/hc/en-us/articles/15202010925332-Bank-Check-File-Format-Bank-of-Montreal
source: STORIS Help Center (storis.zendesk.com)
---

If using the "positive pay" feature and Bank of Montreal is your bank, the following displays the format of the bank check file.

Header Record:

Field

Position

Length

Description

"ARSH"

Left

4

Required text

"ISS"

Left

3

Required text

Customer Name

Left

8

Customer name, comes from Bank Settings via the EFT and Positive Pay tab - Positive Pay Bank Identifier

Account Number

Left

13

Account number comes from Bank Settings via the EFT and Positive Pay tab - Alternate Account Number (if specified) or Account Number

Date

Right

6

Check date in the format of YYMMDD

Test Flag

Left

4

If run in test mode, "TEST" will appear, otherwise, empty space

Spaces

Left

42

Filler spaces

Detail Record:

Field

Position

Length

Description

Account Number

Left

13

Account number comes from Bank Settings via the EFT and Positive Pay tab - Alternate Account Number (if specified) or Account Number

Check Number

Right, zero-padded

10

Check number, zero filled

Check Amount

Right, zero-padded

11

Check amount, zero filled, 2 decimal places

Check Date

Complete

6

Format = YYMMDD (Required Text)

Spaces

Left

15

Space filled

Transaction Type

Complete

1

Transaction Code; I=Issued, V=Voided

Remittance Name

Left

60

Image zone (payee) line 1

Remittance Address

Left

60

Image zone (payee) line 2

Remittance Address

Left

60

Image zone (payee) line 3

Remittance Address

Left

60

Image zone (payee) line 4

Remittance City, State, Zip

Left

60

Image zone (payee) line 5

Spaces

Left

25

Filler Spaces

Footer Record:

Field

Position

Length

Description

"ARST"

Left

4

Required text

Number of Checks

Right

9

Total number of checks exported; with zeros

Total Check Amount

Right

13

Total amount of all exported checks, with zeros

Spaces

Left

54

Filler spaces
