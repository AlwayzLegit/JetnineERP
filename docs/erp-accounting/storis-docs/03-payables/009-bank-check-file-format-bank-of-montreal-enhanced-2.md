---
title: Bank Check File Format - Bank of Montreal Enhanced 2
article_id: 15202012415764
section: 03-payables
index: 9
url: https://storis.zendesk.com/hc/en-us/articles/15202012415764-Bank-Check-File-Format-Bank-of-Montreal-Enhanced-2
source: STORIS Help Center (storis.zendesk.com)
---

If using the "positive pay" feature and Bank of Montreal Enhanced 2 is your bank, the following displays the format of the bank check file.

Header Record:

Field

Position

Length

Type

Justification

Description

"DCSH"

1-4

4

Alphanumeric

Left

Required text

"ISS"

5-7

3

Alphanumeric

Left

Required text

Customer Short Name

8-15

8

Alphanumeric

Left

Customer name, comes from Bank Settings via the EFT and Positive Pay tab - Positive Pay Bank Identifier -Required Text

Account Number

16-28

13

Numeric

Left

Comes from Bank Settings

First 5 digits = Transit

followed by zero (0)

last 7 digits = Account Number

Date

29-34

6

Numeric

Right

Check date in the format of YYMMDD (Required Text)

Currency

35-38

4

Alphanumeric

Left

"CAD" or "USD" (Hard-coded CAD)

Left justified with trailing space (Required Text)

DCS Customer ID

39-48

10

Alphanumeric

Left

DCS Customer ID (Required Text)

Comes from Bank Settings - Positive Pay Bank Identifier

Filler

49-700

652

Alphanumeric

Left

Filler spaces

Detail Record:

Field

Position

Length

Type

Justification

Description

DCS Account Number

1-13

13

Numeric

Left

First 5 digits = Transit
followed by zero (0)
last 7 digits = Account Number

(i.e. 1234507654321)

Check Number

14-23

10

Numeric

Right

Check number, left-padded with zeros

Required Text
(i.e. 0012345678)

Check Amount

24-34

11

Numeric

Right

Check amount-left -padded with zeros; no explicit decimals; 2 decimals implied

Date

35-40

6

Numeric

Right

Format = YYMMDD (Required Text)

Additional Data

41-55

15

Alphanumeric

Left

Space filled

Transaction Code

56

25

Alphabetic

Left

I=Issued

V=Voided

Image Zone 1
(Line 1)

57-116

60

Alphanumeric

Left

Remit To Name
(often Beneficiary name)

Image Zone 2
(Line 2)

117-176

60

Alphanumeric

Left

Remit To Address line 1

Image Zone 3
(Line 3)

177-236

60

Alphanumeric

Left

Remit To Address line 2

Image Zone 4
(Line 4)

237-296

60

Alphanumeric

Left

Remit To Address line 3

Image Zone 5
(Line 5)

297-356

60

Alphanumeric

Left

Remit To City, State, Zip

Filler

357-700

344

Alphanumeric

Left

Space Filled

Footer Record:

Field

Position

Length

Type

Justification

Description

Record Type

1-4

4

Alphanumeric

Left

DCST = Trailer Record
Required text

Total Item Count

5-13

9

Numeric

Right

Total number of detail records in the file; left-padded with zeroes

Total Item Amount

14-26

13

Numeric

Right

Total amount of all checks in the file; left-padded with zeroes; no explicit decimals; 2 decimals implied

Filler

27-700

674

Alphanumeric

Left

Filler spaces
