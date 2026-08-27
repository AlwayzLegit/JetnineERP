---
title: Bank Check File Format - Wachovia
article_id: 15202012591124
section: 03-payables
index: 17
url: https://storis.zendesk.com/hc/en-us/articles/15202012591124-Bank-Check-File-Format-Wachovia
source: STORIS Help Center (storis.zendesk.com)
---

If using the "positive pay" feature and Wachovia is your bank, the following displays the format of the bank check file.

Header Record:

Position

Field Description

Field Size

Type

01-20

RECONCILIATIONHEADER (literal)

20

Alpha

21-24

Bank Number

DC - 0052, FL - 0003, GA - 0005, MD - 0014, NC - 0001, SC - 0004TN - 0006, VA - 0007, CT - 0020, DE - 0049, PA, NY, NJ - 0075

04

Numeric (RJ/ZF)

25-37

Account Number

13

Numeric (RJ/ZF)

38-49

Total Dollar Amount of File or all Zeros (without the decimal point)

12

Numeric (RJ/ZF)

50-54

Total Item Count of File or all Zeros (without the commas)

05

Numeric (RJ/ZF)

55-150

Filler (check one) zero or blank

96

Alphanumeric

Detail Record:

Position

Std. Other

Field Description

Max. Field Size

Std. Other

Type

01-13

n/a

Account Number

13

n/a

Numeric (RJ/ZF)

14-23

Check Serial Number

10

Numeric (RJ/ZF)

24-33

Check Amount (without the decimal point)

10

Numeric (RJ/ZF)

34-41

Issue Date (YYYYMMDD-std.)

8

Numeric

42

n/a

Void Indicator (V-std.)

Other (except X or -)

01

n/a

Alphanumeric

43-72

Additional Data (SSN, payee name, etc.) **Please note important point below

30

Alphanumeric

73-80

n/a

Filler (check one) zero or blank

8

n/a

Alphanumeric

81-130

n/a

Payee Name for Payee Match (Field is Required Field for PMPP)

50

left justified

Alphanumeric

131-150

Filler (check one) zero or blank

20

Alphanumeric

**For information to appear on paper ARP reports, use first 15 characters only; for ARP CD's or Data Transmissions, 30 characters are available.
