---
title: Request Legally Entitled To (LET) Documents
article_id: 15202278504596
section: 04-receivables
index: 102
url: https://storis.zendesk.com/hc/en-us/articles/15202278504596-Request-Legally-Entitled-To-LET-Documents
source: STORIS Help Center (storis.zendesk.com)
---

Access

Accounting > Receivables > Print Receivables Document > Request Legally Entitled To (LET) Documents

Use this routine to print a Legally Entitled To (LET) document for a selected customer. For all sales of merchandise financed using a Revolving Receivables payment plan, STORIS tracks the sale and any subsequent applications of deposits, payments, and fees, thus maintaining the level of detail necessary to produce Legally Entitled To (LET) documents. The LET documents show the items to which your organization is legally entitled, as well as the customer's

outstanding debt,

purchase history since their last zero balance date, and

payment history.

LET documents are required for customers who default and thus become candidates for repossession. Use LET documents to determine the merchandise you can repossess in consideration of the customer's remaining account balance.

STORIS provides form documents your customers can sign on which the customer

allows you to take merchandise that was not included on the LET and

agrees that the merchandise was voluntarily offered for repossession.

NOTE: For customers beyond the number of months retention, the End-of-Month process purges all LET documents older than the customer's last zero balance date.

In order to print the full repossessions report, you must have permission via the Repossession - Access Waived (LET) Items setting in Create a User/Group Actions - Receivables Security. Without this setting enabled, the Items Purchased Since Last Zero Balance Date section is not included in the printed report.

Customer Customer

Enter the code of the customer for which you want to print an LET document. If you click on the Search button, the Search for a Customer screen appears from which you can choose a customer. Once you specify a valid customer, the name and address information display on the screen.

NOTE: This lookup may be affected by Regional Processing restrictions. That is, the lookup lists only customers to which you have access.

The system checks the customer's legal settings to determine if any of the legal codes assigned are set to NOT allow repossessions. If any are set this way, only users with permission to override restrictions via the Receivables security setting Repossession; Override Legal Setting for Allowing Repossessions can proceed with generating a Legally Entitled to Take document for this customer.

LET Expiration LET Expiration

Date The LET expiration date (if any) displays for the selected customer. The LET expiration date equals the customer's next cycle date.

LET Print Version LET Print Version

Specify the LET print version. At this time, only the short version is available and thus this field is inactive.

Send Output to Send Output to

The output destination of the report displays. To change the output destination, click on the Actions button and select Output Settings.

Export Path Export Path

If you select NFS as your output option, the export path displays. You cannot edit the export path using this process. To edit the export path, use the Maintain NFS Root Paths routine.

Actions

Overview of LET Documents

The Request Legally Entitled To (LET) Documents prompts for the customer's account number. The program checks the customer's LET expiration date. If one exists, a prompt appears via which you can reprint the LET document or decline to reprint and return to the Customer prompt.

Each time you print a LET document, the system

references the customer's next cycle date,

records it to the Customer field as the expiration date for the LET, and

uses the date as the flag allowing or disallowing the repossession return to be activated for the customer.

The system updates the LET expiration date as follows:

If a LET expiration date exists for the customer, a prompt to reprint the LET form appears. If you choose to print the LET for the customer, the system updates the LET expiration date with the next appropriate cycle date for that customer. If you decline, you return to the Customer prompt.

If the no LET expiration date exists for the customer, the prompt to reprint the LET form does not appear. If you choose to print the LET for the customer, the system updates the LET expiration date with the next appropriate cycle date for that customer.

LET Document (Short Form)

The Short form of the LET documents contains the customer's information along with the details necessary to identify and repossess the items from the customer. The document has an expiration date. If the items have not been repossessed prior to this expiration date then a new LET document must be printed and used for the repossession of the merchandise.

This form lists all merchandise purchased by the customer in the order of purchase as well as the legally-entitled-to items from any invoices that carry a remaining balance owed on the revolving account. These items are listed in a specific order within completed order based upon the merchandise's retail value from lowest to highest as stated in the customer's Revolving Purchase agreement.

Legally Entitled To Items

Retail Purchases since Last Zero Balance Date

Repossession Notice

Waiver of Rights

The LET document print program builds the table containing the data required for the Legally Entitled To Items and the Retail Purchases since Last Zero Balance Date sections of the short form. If the customer has no Revolving balance due or no purchase history, a warning message appears. The program retrieves the customer name, customer balance, and co-applicant names from the Customer and Customer Joint records for use in the Repossession Notice and Waiver of Rights sections of the short form.

NOTE: The zero balance date is the most recent date on which no open balance amounts existed for the customer. The system captures this date is captured when a customer pays the account down to zero and when you set up a new customer account.

Legally-Entitled-To Items

This section of the LET document lists only those items that belong to an invoice that has not yet been paid in full. These items will be listed in invoice date order by invoice # and within invoice by retail price paid for the item from least expensive to most expensive. The items chosen for the LET section will be taken from the last piece on the order, until the remaining revolving balance has been filled. This section of the document will not list any items that have been marked as returned via customer return or repossession. Additionally this section will not list those items which cannot be repossessed such as flooring. Those items that are not able to be repossessed will be assigned to a product group that has had the Legally Entitled to Repossess box un-checked in the Group settings. This section of the short form will include:

Seq Nbr – The sequence number that was assigned to the items from the 'Items Purchased Since Last Zero Balance Date' section of the report.

Invoice Date – The date that the order was invoiced (finalized)

Invoice # - The document number assigned to the invoice.

Product Number – The SKU for the product

Description – the description contained in the product master for that SKU or model number.

Brand – The Brand contained in the product master or on the completed order for that SKU or model number

Piece Number - The sequence number for that specific piece of merchandise where applicable.

Sell Price - The retail selling price for the item at the time of sale.

Price Paid - The retail purchase price that the customer paid for the item including discounts.

Items Purchased Since Last Zero Balance Date in Date / Amount Order

This section of the LET document lists all revolving purchase activity since the last zero balance date. This section lists only those items that were purchased by the customer on invoices where all or part of the balance was financed on a revolving plan type. These items list in invoice date order by invoice number and within invoice by the retail price paid for the item from least expensive to most expensive. Any delivery or installation charges also list in this section.

Export XML File to NFS

If you choose to export the report to NFS, the system creates an XML file and writes to the location specified in the Maintain NFS Root Paths routine. The program names the file using the following information:

a prefix LET',

an underscore,

customer account number,

an under-score,

the date on which the file was produced (in mmddyyyy format), and

an XML suffix.

For example:

LET_10133781_02242009.XML

If a file with the same name already exists in the NFS shared folder, the program overwrites it.

LET Forms

STORIS provides a standard Enhanced Laser form you can use to print LET documents. You can make a copy of the standard and modify the copy in any way you see fit.
