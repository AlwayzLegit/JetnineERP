---
title: Metro 2 Customer Credit Recovery
article_id: 15202279814420
section: 04-receivables
index: 71
url: https://storis.zendesk.com/hc/en-us/articles/15202279814420-Metro-2-Customer-Credit-Recovery
source: STORIS Help Center (storis.zendesk.com)
---

Access

Accounting > Revolving Receivables > Metro 2 Features > Metro 2 Recovery

Accounting > Installment > Metro 2 Features > Metro 2 Recovery

Use this routine to allow the recovery data, saved from the last Metro 2 reporting process, to be copied back to the CUSTOMER, IR.ACTIVE, and/or IR.HISTORY files. Once complete, the Report Metro 2 Customer Credit Reporting process can be restarted. When a customer record is recovered successfully, the recovery record is updated to true. If a customer is skipped because of locking, this flag remains false.

Once the recovery process is complete, one of two messages is displayed. If done successfully, a message is displayed stating all customer records have been recovered. If any customer records were not able to be recovered, a message is displayed stating that XX customer records were skipped due to locking and the recovery process needs to be rerun to update those customers. The recovery process can be run multiple times and only the records that have not been previously updated are selected.

NOTE: Menu access should only be granted to those individuals authorized to run the Metro 2 process. Please note that there is no special staff security used when allowing access to this process.

Please note that this recovery process is used so that if there is a fatal error in processing, that physically stopped the Metro2 process, it can be rerun.

Start Date Start Date

The date of the day after you last ran a credit reporting displays. You cannot edit this field.

If the system cannot find a Last Credit Reporting Date, the start date defaults to 30 days previous to the current system date.

Ending Date Ending Date

The current system date displays. You cannot edit this field.
