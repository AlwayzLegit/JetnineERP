---
title: Bank Check File Format - BB&T Bank
article_id: 15202012411412
section: 03-payables
index: 10
url: https://storis.zendesk.com/hc/en-us/articles/15202012411412-Bank-Check-File-Format-BB-T-Bank
source: STORIS Help Center (storis.zendesk.com)
---

If using the "positive pay" feature and BB&T is your bank, the following displays the format of the bank check file.

Field

Position

Description

Length

Type

Comments/Contents

1

01-01

Record Code

1

Alphabetic

Required field, "C" for check or "V" for void

2

02-143

Account Number

13

Numeric

Required field, right justified, leading zeros

3

15-24

Check Number

10

Numeric

Required field, right justified, leading zeros. Commas and decimal points are not allowed in this field.

4

25-34

Check Amount

10

Numeric

Required field, right justified, leading zeros. Has two assumed decimal positions. Commas and decimal points are not allowed in this field.

Format: 99999999V99

5

35-40

Check Date

6

Numeric

MMDDYY

6

56-135

Payee Name

80

Alphanumeric

Left justified, space filled
