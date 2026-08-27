---
title: Bank Check File Format - The Private Bank
article_id: 15202011077908
section: 03-payables
index: 15
url: https://storis.zendesk.com/hc/en-us/articles/15202011077908-Bank-Check-File-Format-The-Private-Bank
source: STORIS Help Center (storis.zendesk.com)
---

If using the positive pay feature and The Private Bank is your bank, the Create Bank Check File process creates a comma separated text file in the following format.

Field

Positions

Length

Characteristics

Description

1

1

1

Alphanumeric

Constant value = C

2

2-4

3

Numeric

Bank number = 992

3

5-6

2

Numeric

Zeros

4

7-16

10

Numeric

Account number

5

17

1

Alphanumeric

Blanks

6

18

1

Alphanumeric

Transaction type R = Register V = Void

7

19

1

Alphanumeric

Action indicator A = Add D = Delete

8

20

1

Alphanumeric

Spaces

9

21-30

10

Numeric

Check number

10

31-40

10

Numeric

Check amount

11

41-46

6

Numeric

Issue date MMDDYY

12

47-142

96

Alphanumeric

Optional payee name
