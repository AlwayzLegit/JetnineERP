---
title: Create a Recurring Journal Entry
article_id: 15186368857876
section: 02-general-ledger
index: 1
url: https://storis.zendesk.com/hc/en-us/articles/15186368857876-Create-a-Recurring-Journal-Entry
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > General Ledger > Recurring Entries > Create a Recurring Journal Entry

Use this routine to create and save journal entries so you do not have to re-enter them each time you want to post them. You can also use this routine to generate the required postings.

Recurring Journal Number Recurring Journal NumberEnter an existing recurring journal entry definition number or press <ENTER> to create a new one. If you click on the Search button, a list of recurring journal numbers appears, from which you can make a selection. If you enter an existing reference, all fields display and you have the option to modify and/or post the definition.

NOTE: Recurring journal entry definition numbers are distinct from batch numbers.

General Tab

Company CompanySelect a company from the drop-down box. If multi-company processing is active, you can enter any valid Company key. Otherwise, the default company appears and you cannot edit this field.

Posting Frequency Posting Frequency

The Report Recurring Journal Entries references this field to alert you when a batch should be posted. If you click on the arrow, the following options appear from which you can make a selection:

P – Generate the posting each fiscal period (except period 13).

Q – Generate the posting in the last fiscal period of each quarter.

Periods 1 through 13 – Generate the posting in the specified fiscal period.

Description DescriptionEnter a free-text description of this recurring journal entry.

Delete After Post Delete After PostTo delete the definition after generating the first posting, check the box. Otherwise, leave the box blank.

Last Posting Last PostingThe date of the last actual update appears.

Create the Posting

Transaction Date Transaction DateSpecify the transaction date on which to post this recurring journal entry. After you enter a transaction date, the period in which the transaction date falls displays.

Update Button Update Button

To generate the GL posting batch as part of the final update processing, click on this button. This button is active when:

A transaction date has been specified

At least 2 detail postings have been specified.

The detail postings are in balance.

The system either saves the recurring journal entry with any changes (including the new last posting set), or deletes it if the Delete After Post flag is set. Before deletion, a warning message appears with the option to abort. The screen refreshes after the update.

Detail Tab

Use this tab to specify detail postings.

Account Account

Enter the number of the account you want to enter or edit. You must specify the complete account number (that is, the root, the sub-account (if applicable), and the cost center). For existing accounts, if you click on the Search button, you access the GL Account Entry screen which you can use to specify the account by element as well as view a lookup for each element. If you click on the Action button, you access the GL Account Lookup screen.

NOTE: Duplicate GL accounts are allowed in the batch. Therefore, in order to maintain an existing detail posting, you must select it from the grid.

Remark RemarkEnter or edit the remark (if any) you want to associate with the selected account. Note that if you enter Remark text on this tab, you cannot enter Comments on the Header tab, and vice-versa.

Debit DebitFor TPA users, the debit amount appears here and you cannot edit this field.

For STORIS GL Processing users, enter a debit amount. The amount must be a positive number. Note that you must enter an amount here or an amount at the Credit field.

Credit CreditFor TPA users, the credit amount appears here and you cannot edit this field.

For STORIS GL Processing users, enter a credit amount. The amount must be a positive number. Note that you must enter an amount here or an amount at the Debit field.

Debit Total Debit TotalThe debit total appears here. This is a display-only field.

Credit Total Credit Total The credit total appears here. This is a display-only field.

Comment CommentEnter or edit the comment (if any) you want to associate with the selected account. Note that if you enter Comment text on this tab, you cannot enter Remarks on the Header tab, and vice-versa.
