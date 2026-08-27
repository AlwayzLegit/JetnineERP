---
title: General Ledger Processing Overview
article_id: 15186368847124
section: 02-general-ledger
index: 4
url: https://storis.zendesk.com/hc/en-us/articles/15186368847124-General-Ledger-Processing-Overview
source: STORIS Help Center (storis.zendesk.com)
---

STORIS provides a complete Accounts Payable/General Ledger processing feature as well as an interface to third-party accounting packages (TPA) such as QuickBooks®. You must select one of these accounting methods before you begin processing on STORIS, and you cannot mix elements of each to create a "hybrid" accounting package. This topic serves as an overview to STORIS General Ledger Processing.

STORIS General Ledger Processing

Use this feature to analyze and generate data required to create financial statements within the STORIS application.

If the GL module is active (via the General System Control Settings), the system assumes you are running STORIS GL Processing. If so, you can create and maintain a GL chart of accounts within STORIS. To specify your preferences for STORIS GL Processing and build data to support processing, use the following routines:

General Ledger Control Settings

General Ledger Assigned Account Settings

NOTE: GL User Permissions are not enforced in the above processes.

STORIS GL Processing integrates with all STORIS products in real time within one centralized database, without the need for a download or transmission interface to a third-party accounting program. Additionally, you can use the FGII data access tool to support all GL data on the STORIS host server with spreadsheet logic to facilitate the presentation of both financial and comparative user-defined analytics.

STORIS GL Processing includes the following features:

Charts of accounts - you can build and maintain a chart of accounts within STORIS.

Account structure - full GL account structure is supported, including the option to use sub-accounts.

Period tables – you can specify your own GL periods or use a calendar-based system.

Account classification – three levels of classification are available for reporting and inquiry purposes.

General Ledger User Permissions - you can restrict user input and inquiry of GL account information based on any combination of root account, sub-account, and cost center.

Reports and inquiries – a full range of reports and inquiries are available, through which you can generate financial statements from within STORIS as well as dynamically run the FGII reporting tool.

GL Account Structure

Account numbers in STORIS consist of the following three elements:

Company

Root Account

Cost Center

We recommend you use dashes for delimiters. You cannot use any of the following as a delimiter:

the underscore character "_"

any letter

any number

For the second element (root account), you can enter any alphanumeric characters. In addition, the option to use a fourth element, for example a sub-account, is available. You must activate the sub-account feature via the General Ledger Control Settings, and once you set it you cannot change it.

Classification

For reporting and inquiry purposes, you can classify your GL accounts. The following levels of classification are available for each account:

Class

Sub-Class

Group

Use the following routines to define the GL Account Hierarchy. Note that these routines are available only if STORIS GL Processing is active.

GL Class Settings

GL Sub-Class Settings

GL Group Settings

Security

You can restrict user access to GL accounts in entry and/or inquiry routines. You can specify restrictions to all account elements except the company element. Note, however, that GL staff security does not apply to control or settings routines.

NOTE: Standard location restrictions, including Regional Processing, do not apply to the STORIS General Ledger Processing module.

General Ledger Reports

When credit hits mix with debits on a report, the system signs them with a preceding negative sign. When credits are identified as such by a header (for example, GL Recap), the system does not sign them.

Batch Maintenance

The Report Suspended Postings lists GL post records that have not been posted. To correct suspended batches, use the Post/Update a Journal Entry routine.
