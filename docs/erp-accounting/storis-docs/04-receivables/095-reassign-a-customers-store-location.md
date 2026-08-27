---
title: Reassign a Customer's Store Location
article_id: 15202297405716
section: 04-receivables
index: 95
url: https://storis.zendesk.com/hc/en-us/articles/15202297405716-Reassign-a-Customer-s-Store-Location
source: STORIS Help Center (storis.zendesk.com)
---

Access

Accounting > Receivables > Reassign a Customer's Store Location

Accounting > Revolving Receivables > Reassign a Customer's Store Location

Use this routine to manually transfer customers from one store location to another. The program transfers Accounts Receivable and Deposit Liability balances and makes all necessary General Ledger postings. The Store Location field in the Customer Settings also updates with the change.

Customer Customer

Enter the code of the customer whose AR location you want to reassign. If you click on the Search button, the Search for a Customer screen appears.

Once you specify a valid customer, the customer's current store location and Open Item, Revolving, Installment, and Deposit Liability balances display on the screen.

The Installment Receivables balance that is displayed is the long-term balance. Any short term balances are included in the Open Item balance.

New Store New Store

Enter the code of the location to which to reassign the customer. If you click on the Arrow, a list of locations appears from which you can choose.

System Updates

When you click on Save, the program performs the following updates:

The customer's Store Assignment field in the Customer Settings updates with the new store location. A comment posts to the Customer Activity Log.

If the new store location has a different due day than the previous location, the new store's due date overwrites the existing due date in the Customer Settings, and the customer's next cycle occurs on the first due cycle day that falls at least 30 days after their last cycle date. Note that this may cause the customer to have an extended cycle period (more than 30 days) after the transfer occurs.

The following General Ledger posting transfers the customer's Deposit Liability balance from the old store to the new store:

- Debit Deposit Liability account for the old store

- Credit Deposit Liability account for the new store

The following General Ledger posting transfers the long term balance for all of the customer's active Revolving plans from the old store to the new store:

- Debit Accounts Receivable for the new store

- Credit Accounts Receivable for the old store

The following GL posting transfers the long-term balance for all of the customer's active Revolving plans from the old store to the new store:

- Debit Long Term Revolving for the new store

- Credit Long Term Revolving for the old store

The system calculates and posts interest and insurance to their respective 'Unearned' accounts when the Revolving plans cycle and the interest and insurance amounts earned when a Revolving MMP is paid. To ensure proper reporting of unearned/earned interest and insurance amounts, the system transfers the unearned amounts from the customer's old store to their new store.

The system determines the payment types for unearned and earned interest based on the memo reference for the MMP. The posting is:

- Debit Unearned Interest for the new store

- Credit Unearned Interest for the old store

The system determines the insurance code for unearned and earned insurance based upon the memo reference for the insurance portion of the MMP. The posting is:

- Debit Unearned Insurance for the new store

- Credit Unearned Insurance for the old store

The system evaluates the customer for Collections assignment and, if found, reassigns the customer to the appropriate collector for their new location.
