---
title: Report Suspended Postings
article_id: 15203214448020
section: 01-views-and-reports
index: 58
url: https://storis.zendesk.com/hc/en-us/articles/15203214448020-Report-Suspended-Postings
source: STORIS Help Center (storis.zendesk.com)
---

Access

Accounting > General Ledger > Additional GL Reports > Report Suspended Postings

Use this routine to print GL post records that have not been posted. The report sorts by company, with a page break for each. If you run the report for

invalid transactions, the report also sorts and breaks on GL source.

hold transactions, the report also sorts and breaks on operator.

The report includes either the header comment or the line items remarks, but not both, as well as line comments if they exist. For invalid transactions, all reasons print beneath each batch. Once the run-time options have been selected, choose Run to produce the report.

NOTE: GL security is not enforced in this routine.

To correct suspended batches, use the Post/Update a Journal Entry routine.

Company Company

Enter the companies for which you want to run this report. If multi-company processing is active, you can specify any valid company. If multi-company processing is not active, the default company appears and you cannot edit the field.

If you leave this field blank, you choose all companies. If you click on the Arrow, a list of companies appears from which you can choose. If you click on the Action button, you access the Multiple Company Selection screen, from which you can choose one or more companies.

Reason Reason

This field lists the two possible reasons why a batch is "un-posted" (that is, suspended). The report lists suspended batches associated with the reason you select here. You have the following options:

Invalid - activates the Source field and de-activates the Operator field.

Hold - activates the Operator field and de-activates the Source field.

SourceSource

Enter the GL source for which you want to run this report. If you leave this field blank, you choose all sources. If you click on the Arrow, a list of sources appears from which you can choose. If you click on the Action button, you access the Multiple GL Source Selection screen, from which you can choose one or more sources.

This field is active only if you select Invalid at the Reason field.

OperatorOperator

Enter the operator for which you want to run this report. If you leave this field blank, you choose all operators. If you click on the Arrow, a list of operators appears from which you can choose. If you click on the Action button, you access the Multiple Operator Selection screen, from which you can choose one or more operators.

This field is active only if you select Hold at the Reason field.

Send Output to Send Output toThe output destination of the report displays. To change the output destination, click on the Actions button and select Output Settings.

Export Path Export PathIf you select either the Personal Report Viewer (PRV), Excel Export, or ASCII Export, this field displays the pre-set computer drive and folder location to which the system exports the report data. You cannot edit the export path using this process.
