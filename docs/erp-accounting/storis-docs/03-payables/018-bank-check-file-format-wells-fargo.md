---
title: Bank Check File Format - Wells-Fargo
article_id: 15202012590996
section: 03-payables
index: 18
url: https://storis.zendesk.com/hc/en-us/articles/15202012590996-Bank-Check-File-Format-Wells-Fargo
source: STORIS Help Center (storis.zendesk.com)
---

If using the "positive pay" feature and Wells-Fargo is your bank, the following displays the format of the bank check file.

Column Header

Column Formatting Instructions

BID

Payer Number from Bank Settings

RID

Account Number from Bank Settings

Routing transit number or Bank ID

from the BANK record - must be exactly 9 digits numeric.

Account number

from the BANK record - can be up to 10 characters numeric with no punctuation.

Serial number

from the AP PAYMENT REGISTER record - up to 10 characters numeric.

Issue date

from the AP PAYMENT REGISTER record - in the format MM-DD-YYYY.

Amount

Sum of the values from the AP PAYMENT REGISTER record - in the format 99999.99 where the decimal point and cents are always present even when the cents are 00.

Transaction type

"320" for all normal checks and "430" for voided checks where the APR STATUS from the AP PAYMENT REGISTER file is set to "VOI".

Memo

REMIT NAME from the AP PAYMENT REGISTER file - can be up to 120 characters alphanumeric and can include spaces and/or any of the following punctuation characters: ' " / \ * ( ) # . - = ` _ $
