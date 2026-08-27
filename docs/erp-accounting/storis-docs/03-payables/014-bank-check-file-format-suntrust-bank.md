---
title: Bank Check File Format - SunTrust Bank
article_id: 15202012411924
section: 03-payables
index: 14
url: https://storis.zendesk.com/hc/en-us/articles/15202012411924-Bank-Check-File-Format-SunTrust-Bank
source: STORIS Help Center (storis.zendesk.com)
---

If using the "positive pay" feature and SunTrust Bank is your bank, the following displays the SunTrust Bank Single Point format of the bank check file called SUN TRUST BANK. Its format is "fixed-length text file".

Position

Field

Length

Characteristics

Comment

1-13

Account Number

13

Numeric

Bank Checking account number, zero-filled.

14-23

Check Serial Number

10

Numeric

Check number, zero-filled

24-33

Check Amount

10

Numeric

Implied two decimals. 999999=9999.99, zero-filled

34-39

Check Date

6

Numeric

MMDDYYYY

40-54

Additional Data

15

Alphanumeric

Internal identification information. Optional field

55

Void Indicator

1

Alphanumeric

Contains the letter "V" to indicate a void check

56-95

Payee 1

40

Alphanumeric

Remit to from AP.PAYMENT.REGISTER file. Space-filled. If name contains commas, quotations must be used around the field. This is for Positive Pay with Payee Name Verification only.

96-135

Payee 2

40

Alphanumeric

Remit to name two from AP.PAYMENT.REGISTER file. Space-filled. If name contains commas, quotations must be used around the field. This is for Positive Pay with Payee Name Verification only.

136-160

Filler

25

Alphanumeric
