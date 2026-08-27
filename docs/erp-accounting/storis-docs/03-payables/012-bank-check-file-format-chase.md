---
title: Bank Check File Format - Chase
article_id: 15202012592404
section: 03-payables
index: 12
url: https://storis.zendesk.com/hc/en-us/articles/15202012592404-Bank-Check-File-Format-Chase
source: STORIS Help Center (storis.zendesk.com)
---

If using the "positive pay" feature and Chase is your bank, the following displays the format of the bank check file.

Position

Field

Format

Comment

1

Transaction Indicator

X

Always "I"

2-18

Account Number

9(17)

Bank Checking account number, zero filled

19-28

Check Number

9(10)

Check number, zero filled

29-34

Check Date

9(6)

MMDDYY

35-45

Check Amount

9(8).99

Explicit decimal point, example 99999999.99

46-75

Filler

X30)

Spaces

76-125

Payee 1

X(50)

Remit-to from AP.PAYMENT.REGISTER file. Space filled.

126-175

Payee 2

X(50)

Remit-to Name two from AP.PAYMENT.REGISTER file. Space filled.
