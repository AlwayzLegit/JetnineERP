---
title: Bank Check File Format - US Bank
article_id: 15202011074964
section: 03-payables
index: 16
url: https://storis.zendesk.com/hc/en-us/articles/15202011074964-Bank-Check-File-Format-US-Bank
source: STORIS Help Center (storis.zendesk.com)
---

If using the "positive pay" feature and US Bank is your bank, the following displays the US Bank Single Point format of the bank check file called USBANK. Its format is "fixed-length text file".

Position

Field

Format

Comment

1-12

Account Number

9(12)

Bank Checking account number, zero-filled.

13-22

Check Number

9(10)

Check number, zero-filled

23-34

Check Amount

9(10)v99

Implied two decimals. 999999=9999.99, zero-filled

35-42

Check Date

9(8)

MMDDYYYY

43-44

Action

X(2)

IS=issue CN=cancel

45-84

Payee 1

X(40)

Remit to from AP.PAYMENT.REGISTER file. Space-filled. If name contains commas, quotations must be used around the field. (optional)

85-124

Payee 2

X(40)

Remit to name two from AP.PAYMENT.REGISTER file. Space-filled. If name contains commas, quotations must be used around the field. (optional)

NOTE: STORIS also offers a format called USBANK2, whose format is a comma-delimited text file. The format for this file is Bank Account Number, Payment Reference, Check Amount, Check Date, Action, Remit to Name 1, Remit to Name 2.
