---
title: Format EFT Data for National Bank
article_id: 15202028505236
section: 03-payables
index: 33
url: https://storis.zendesk.com/hc/en-us/articles/15202028505236-Format-EFT-Data-for-National-Bank
source: STORIS Help Center (storis.zendesk.com)
---

This process collects the necessary data in the National Bank format.

Header Record:

Field

Number

Contents

Position

Format

Description

1

A

1

X(1)

Type of record - Always the letter 'A'

2

000000001

2-10

N(9)

Record Counter – Always 000000001 for the 'A' record

3

11-20

X(10)

User's Number – Assigned by the bank

Bank Settings – Payer Number

(BA.PAYER.NBR)

4

21-24

N(4)

File Creation Number - right justified, left zero filled – increments by 1 for each subsequent file creation (ACR.EFT.NATIONAL.SEQ.NBR)

5

0YYDDD

25-30

N(6)

File creation date – in Julian format

(ACR.EFT.FILE.CR.DATE)

6

00610

31-35

N(5)

Addressee – Always 00610

Bank Settings – Destination Data Center

(BA.DEST.DATA.CTR)

7

Blanks

36-55

X(20)

Filled with blanks

8

56-58

X(3)

Currency Code Indicator – CAD = Canadian dollars, USD = US dollars

All payments in this file must use the same currency. This currency code will be set from the first payment.

9

Blanks

59-1464

X(1406)

Filled with blanks

Detail Record:

Field Number

Contents

Position

Format

Description

1

C

1

X(1)

Type of Record - C=credit

2

First detail record will be 000000002 (increments with each record)

2-10

N(9)

Record Counter – 1 per 1464 byte record sequentially ascending, right justified, left zero filled

3

User Number plus File Creation Number (fields 3 and 4 from "A" record)

11-24

X(14)

10 character User's Number – Bank Settings – Payer Number (BA.PAYER.NBR) followed by 4 digit File Creation Number (ACR.EFT.NATIONAL.SEQ.NBR) These are fields 3 and 4 from "A" Header record.

Segment 1

4

460

25-27

N(3)

Operation Code – 460 for Accounts Payable

5

28-37

N(10)V99

Amount – right justified, left zero filled, two decimals implied – Must be greater than zero - Payment Amount

6

0YYDDD

38-43

N(6)

Transaction Date – Payment Date – in Julian format

7

0BBBTTTTT

44-52

N(9)

Beneficiary (Payee) Institutional ID

0-constant

BBB – Vendor Remit To Settings – Financial Institution (VTO.FINANCIAL.NBR)

TTTTT - Vendor Remit To Settings – Transit Number (VTO.TRANSIT.NBR)

8

53-64

X(12)

Beneficiary (Payee) Account Number – left justified, blank filled - Vendor Remit To Settings –Account Number (VTO.ACCNT.NBR)

9

zeroes

65-86

N(22)

Filler – 22 zeroes

10

zeroes

87-89

N(3)

Stored Transaction Type – Always zero fill

11

Originator Short Name

90-104

X(15)

User (Originator) Short Name – left justified, blank filled – Bank Settings – Originator Short Name (BA.ORIGIN.SHORT.NAME)

12

Payee Name

105-134

X(30)

Beneficiary (Payee) Name – left justified, blank filled - Vendor Remit To Settings – Remit To Name (VTO.NAME)

13

Originator Long Name

135-164

X(30)

User (Originator) Long Name –

left justified, blank filled - Bank Settings – Originator Long Name (BA.ORIGIN.LONG.NAME)

14

165-174

X(10)

User (Originator) ID –

Bank Settings – Payer Number

(BA.PAYER.NBR)

15

175-193

X(19)

Cross Reference Number – left justified, blank filled (ACR.APRVD.APR.KEY)

Made up of the following:

Vendor ID – key to the VENDOR record (5 characters)

File Number – a sequential number similar to a check number, six digits with a 2 character prefix of 'CP', for a total of 8 characters (APR.PAY.REF)

Date – the payment date, 6 digits in the format YYMMDD

16

0BBBTTTTT

194-202

N(9)

User (Payer) Institutional ID for returns

0-constant

BBB – Bank Settings – Financial Institution (BA.FINANCIAL.NBR)

TTTTT – Bank Settings – Transit Number (BA.PAYER.TRANSIT)

17

203-214

X(12)

Payer Account number for returns – left justified, blank filled

Bank Settings – Account Number (BA.ACCT.NBR)

18

Blanks

215-229

X(15)

User's (Originator's) Sundry Information – Not used

19

Blanks

230-251

X(22)

Filled with blanks

20

Blanks

252-253

X(2)

Filled with blanks

21

zeroes

254-264

N(11)

Invalid Field Indicator – Always zero fill

Additional payments for this EFT batch. If a second payment exists, 22-39 use the same layouts as fields 4-21. If a third payment exists, 40-57 use the same layouts as fields 4-21, and so on. The fields are blank filled if no additional payments exist. Each record must total 1464 bytes.

265-1464

For each payment in this EFT batch, field layouts 4-21 are repeated and appended to this current record using the same spacing and values up to a maximum of five additional payments. Fields 4 through 21 are 240 bytes. A segment containing data may not follow a blank segment within the same record.

22-39

Segment 2

265-504

Payment #2

40-57

Segment 3

505-744

Payment #3

58-75

Segment 4

745-984

Payment #4

76-93

Segment 5

985-1224

Payment #5

94-111

Segment 6

1225-1464

Payment #6

Trailer Record:

Field Number

Contents

Position

Format

Description

1

Z

1

X(1)

Type of Record - Always the letter 'Z'

2

2-10

N(9)

Record Counter – 1 per 1464 byte record sequentially ascending, right justified, left zero filled

3

User's Number plus File Creation Number (fields 3 and 4 from "A" record)

11-24

X(14)

10 character User's Number – Bank Settings – Payer Number (BA.PAYER.NBR) followed by 4 digit File Creation Number (ACR.EFT.NATIONAL.SEQ.NBR) These are fields 3 and 4 from "A" Header record.

4

00000000000000

25-38

N(14)V99

Total value of D (debit) transactions in file – right justified, left zero filled, two decimals implied – Always zero

5

00000000

39-46

N(8)

Total number of D (debit) transactions in file – right justified, left zero filled – Always zero

6

47-60

N(14)V99

Total value of C (credit) transactions in file – right justified, left zero filled, two decimals implied

7

61-68

N(8)

Total number of C (credit) transactions (payments) in file – right justified, left zero filled

8

Filled with zeroes

69-82

N(14)

Reserved - Filled with zeroes

9

Filled with zeroes

83-90

N(8)

Reserved - Filled with zeroes

10

Filled with zeroes

91-104

N(14)

Reserved - Filled with zeroes

11

Filled with zeroes

105-112

N(8)

Reserved - Filled with zeroes

12

Filled with zeroes

113-1464

X(1352)

Filler - Filled with zeroes

Three types of records are recognized:

"A" records identify the user
"C" records show the details of transactions
"C" records must include six transactions, with each segment identifying one payment. If there are not six transactions in the last "C" record, blanks must be entered until the length of the record is 1464 characters
"Z" records show the number of transactions and the total amount on the file

Each record must have 1464 characters. The process recognizes the "beneficiary" (the vendor or payee) and the "user" (the payer).

The National Bank format recognizes either Canadian or U.S. dollars. An EFT batch must contain payments all in the same currency.
