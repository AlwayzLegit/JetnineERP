---
title: Credit Application Processing Overview
article_id: 15202278290452
section: 04-receivables
index: 28
url: https://storis.zendesk.com/hc/en-us/articles/15202278290452-Credit-Application-Processing-Overview
source: STORIS Help Center (storis.zendesk.com)
---

Credit Application Processing includes the following processes in the Credit Application Management feature:

Credit Application Entry

transmission of application to credit bureau & return of credit report (optional)

manual review and decision

You access the Credit Application Process via the Request Credit Information routine. This process references the following routines at various times:

Credit Application Entry – Use this process to enter or edit a credit application in STORIS.

Need Credit Report – Use this routine to verify whether to pull a credit report. The system generates credit request comments stating whether or not a credit report was pulled.

Credit Report Processor – This process communicates with your credit bureau. It sends credit application information to the credit bureau and retrieves the credit report information from the credit bureau. If a credit report is not needed, this program skips this process. The system generates credit request comments if information is submitted to a credit bureau.

Credit Application Decision Process – The program places credit request items in the pending credit request waiting for a manual decision to be made, and generates a comment stating that the credit request was submitted for manual review.

Credit Application Entry

The credit application entry process is a multi-tabbed process and contains the following processes for application parameter entries:

Primary Applicant

Co-Applicant

Co-Signer

Each of the above processes consists of the following five tabs:

Personal

Residence

Employment

Miscellaneous

Reference

The screen includes Co-applicant and Co-signer check boxes and buttons at the Additional Applicant field, providing access to the Credit Application Entry screens for each. Credit Application Entry screens for each consist of the same tabs listed above. Activation of the check boxes is based on your Credit Application Control Settings. The Co-applicant and Co-signer buttons activate when you check the corresponding check box.

The program encrypts the social security number for the primary and cosigner upon saving and writes it to the Social Security Number field in the Customer Credit record based on the individual customer numbers for the primary applicant and cosigner. The program also updates the credit application record for historical purposes.
