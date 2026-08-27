---
title: Bank Check File Format- Australian Bankers Association (ABA)
article_id: 23766349200148
section: 03-payables
index: 19
url: https://storis.zendesk.com/hc/en-us/articles/23766349200148-Bank-Check-File-Format-Australian-Bankers-Association-ABA
source: STORIS Help Center (storis.zendesk.com)
---

If using the "positive pay" feature and Australian Bankers Association (ABA) is your bank, the following displays the format of the bank check file.

Header Record:

Position

Field Size

Field Description

Specification

1 1 Record Type 0 Must be '0'
2-18 17 Blank Must be blank filled.
19-20 2 Reel Sequence Number 01
21-23 3 Name of User's Financial Institution

Must be approved Financial Institution abbreviation. Bank of Queensland's abbreviation is BQL, Westpac's abbreviation is "WBC".

This value must be entered in Bank Settings – Alternate ID

24-30 7 Blank Must be blank filled.
31-56 26 Name of User supplying file

Must be the 'User Preferred Specification' as assigned by user's financial institution. coded characters are set valid.

This value must be entered in the Bank Settings – Originator Long Name

57-62 6 Name of User supplying file

Must be the 'User Identification Number" which is assigned by the APCA for the user.

This value must be entered in the Bank Settings – Payer Number

63-74 12 Description This value must be entered in the Bank Settings – Originator Short Name
75-80 6 Date to be processed Must be numeric in the formal of DDMMYY.
81-120 40 Blank Must be blank filled.

Record Type 1:

Position

Field Size

Field Description

Specification

1 1 Record Type 1 Must be '1'
2-8 7 Bank/State/Branch Number Must be numeric with hyphen in character position 5. Character positions 2 and 3 must equal valid Financial Institution number. Character position 4 must equal a valid state number (0-9). Characters 6 – 8 are the bank branch. This value must be entered in the Vendor Remit To setting- Financial Institution.
9-17 9 Account number to be credited/debited Only Numeric, hyphens and blanks are valid characters. When the account number exceeds nine characters, edit out hyphens. Right justified, blank filled. This value must be entered in Vendor Remit To - Account Number
18 1 Indicator "N" – for new or varied
19-20 2 Transaction Code The transaction code will be 50 for General Credit.
21-30 10 Amount Only numeric valid. Must be greater than zero. Shown in cents without punctuation. Right justified, zero filled. Unsigned.
31-62 32 Title of Account to be credited/debited This is the Vendor Remit To name. Must not be all blanks. Left justified, blank filled. This value must be entered in Vendor Remit To – Remit to Name
63-80 18 Lodgement Reference A Lodgement refers to the act of depositing money into an account or transferring out of the account. For payments, this reference will be Coco Republic. This value must be entered in the Bank-Originator Short Name setting.

81-87 7 Trace Record
(BSB Number in format XXX-XXX) Bank (FI)/State/Branch and account number of User to enable retracing of the entry to its source if necessary. Only numeric and hyphens valid. Character positions 81 & 82 must equal a valid Financial Institution number. Character position 83 must equal a valid State number (0-9). Character position 84 must be a hyphen. This value must be entered in the Bank - Financial Institution setting.
88-96 9 (Account number) Right justified, blank filled. This value must be entered in Bank– Account Number.
97-112 16 Name of Remitter This value must be entered in the Bank- Originator Short Name setting. Must not contain all blanks. Left justified, blank filled.
113-120 8 Amount of Withholding Tax Numeric only valid. Show in cents without punctuation. Right justified, zero filled. Unsigned.
Record Type 7:

Position

Field Size

Field Description

Specification

1 1 Record Type 7 Must be '7'
2-8 7 BSB Format Filler Must be '999-999'
9-20 12 Blank Must be blank filled.
21-30 10 File (User) Net Total Amount Numeric only valid. Must equal the difference between File Credit & File Debit Total Amounts. Show in cents without punctuation. Right justified, zero filled. Unsigned.
31-40 10 File (User) Credit Total Amount Numeric only valid. Must equal the accumulated total of credit Detail Record amounts. Show in cents without punctuation. Right justified, zero filled. Unsigned.
41-50 10 File (User) Debit Total Amount Numeric only valid. Must equal the accumulated total of debit Detail Record amounts. Show in cents without punctuation. Right justified, zero filled. Unsigned.
51-74 24 Blank Must be blank filled.
75-80 6 File (user) count of Records Type 1 Numeric only valid. Must equal accumulated number of Record Type 1 items on the file. Right justified, zero filled.
81-120 40 Blank Must be blank filled.
