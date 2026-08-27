---
title: Print Credit Request Status Letters
article_id: 15202278290836
section: 04-receivables
index: 92
url: https://storis.zendesk.com/hc/en-us/articles/15202278290836-Print-Credit-Request-Status-Letters
source: STORIS Help Center (storis.zendesk.com)
---

Access

Customer > Electronic Interfaces > Credit Application > Print Credit Status Letters

Accounting > Receivables > Credit Application > Print Credit Status Letters

Use this routine to generate all status letters for a selected letter type that haven't been printed yet, for example all "Decline" letters. If a co-applicant or co-signer exists for the request, a letter is generated for them as well. The process is also used to print credit limit increase letters and credit limit decrease letters that are flagged for batch printing. The letters are emailed if set up to email in the Notification Control Settings process and an email address exists for the customer. Otherwise the letters are printed.

NOTE: In order for the letter to be emailed, all applicants (i.e. primary applicant, co-applicant and/or co-signer) must have an email address available in Advanced Customer Settings.

Notifications Control Settings must be set to allow emailing of status letters.

The Credit Application feature comes delivered with the following Enhanced Laser Print Credit Applications Status Letter form types available via the Forms Designer:

Approval Letter

Decline Letter

Conditionally Approved Letter

STORIS also comes delivered with the following status letter form types available via the Forms Designer:

Credit Limit Increase Letter

Credit Limit Decrease Letter

After Generating the Letters

The system first generates letters to be printed, then generates letters to be emailed. When you print or email a credit request status letter or credit limit change letter, the system updates credit comments, indicating the letter type and date generated. A prompt appears asking if all letters emailed/printed correctly. If you answer Yes, the system flags the letters as emailed/printed and omits them from future letter generation. If you answer No, the process ends and the credit requests are flagged as needing a letter sent.

To reprint a letter, access the Print Status Letter screen via Review Pending Credit Requests, View Credit Request Responses, Customer Credit and Scoring Information, and View Completed Credit Requests.

Select Status Letter to Print Select Status Letter to Print

Select the type of letter you want to generate then click Run. You have the following options:

Approved

Declined

Conditionally Approved

Credit Limit Increase

Credit Limit Decrease

Create XML Files Create XML Files

This setting is active when the Create XML for Credit Decision Letters setting in Maintain Credit Application Letter Print UNC Path is enabled. When checked, all output is sent to an XML file to be printed later.
