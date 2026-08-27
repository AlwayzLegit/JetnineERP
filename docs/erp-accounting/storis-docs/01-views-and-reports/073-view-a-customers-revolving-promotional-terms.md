---
title: View a Customer's Revolving Promotional Terms
article_id: 15295211821204
section: 01-views-and-reports
index: 73
url: https://storis.zendesk.com/hc/en-us/articles/15295211821204-View-a-Customer-s-Revolving-Promotional-Terms
source: STORIS Help Center (storis.zendesk.com)
---

Access

Accounting > Revolving Receivables > Revolving Views and Reports > Revolving Views > View a Customer's Revolving Promotional Terms

Pages: Promotional Terms, General Info

Use this routine to view the terms of Revolving Receivables plan promotions for customers.

NOTE: This routine is a STORIS standard DTS inquiry. You can modify its contents via the Dynamic Tab Settings (DTS Setup) routine, but you cannot delete it. Since DTSs are user-defined and changeable, the descriptions in this topic may not match the DTS you see on your screen. This topic describes the DTS as it appears when you first install STORIS.

The output of this inquiry may be affected by Regional Processing restrictions. That is, you can inquire only about customers and locations to which you have access.

CustomerCustomer

Enter the code of the customer to view transactions for that customer. Click the Search button to access the Search for a Customer routine.

This field may be populated automatically and inactive if this screen is accessed from View All Revolving Plan Activity for a Customer.

Once the customer is selected, the Cell Phone, Home Phone, Work Phone, Ext, and Email Address fields populate. These fields are read-only.

Promotional Terms

Plan PlanSpecify the code of the revolving plan to view. You can click the Arrow button to select a code from the list of active and pending plans for this customer.

Balance BalanceFor pending plans (not activated), the total balance due displays for the selected plan.

Promotional Interest

Percentage Rate Percentage RateThe promotional interest percentage rate, if any, displays from the Revolving Receivables Payment Plans settings.

Expires On Expires OnIf an expiration date was entered for the promotional interest override via the Advanced tab of Revolving Receivables Payment Plans, the date displays here.

Days DaysIf the promotional interest override is set to remain valid based on the Valid For field in Revolving Receivables Payment Plans, the number of days after plan activation that the promotion expires displays here.

Balance BalanceThe revolving balance to which the promotion applies is displayed.

Waived WaivedThe amount of waived interest for the plan, if any, displays. This is interest that was not assessed during an override period and depending on your control settings, might be charged back to the customer's plan.

No Payments

Until UntilFor plans that offer a "no payments due" promotional period, the length of the promotion is based on either a specific date or a number of days after activation. This field indicates the date when this promotion is due to end, if one was specified in your plan settings. If a date was not specified, the For ___ Days field indicates the length of the promotion period. Once the date has been reached, normal payment cycling resumes.

Days DaysFor plans that offer a "no payments due" promotional period, the length of the promotion is based on either a specific date or a number of days after activation. If a date was not specified, this field indicates the number of days after activation during which no payments are due. Once the number of days has been exceeded, normal payment cycling resumes.

Balance BalanceThe revolving balance to which the promotion applies is displayed.

Grid InformationGrid Information

The grid displays the settings established in the Percentage Break Level Table for the selected plan.

General Revolving

This tab is included in every receivables DTS screen.

View General Revolving page
