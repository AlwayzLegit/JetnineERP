# Browser Audit — Finding Index

Rolling index across all sessions. IDs are sequential and never reset.

| Session | Module            | Status   | ID range used     | S1  | S2  | S3  | S4  | Total |
| ------- | ----------------- | -------- | ----------------- | --- | --- | --- | --- | ----- |
| S01     | Sales order entry | Complete | BA-0001 – BA-0041 | 2   | 19  | 18  | 2   | 41    |

## S01 — Sales order entry

| ID      | Sev | Cat    | Screen                     | Title                                                                                       | Proposal |
| ------- | --- | ------ | -------------------------- | ------------------------------------------------------------------------------------------- | -------- |
| BA-0001 | S1  | FLOW   | New Sale                   | In-progress sale is discarded, without warning, on any navigation away                      | P-001    |
| BA-0002 | S1  | DATA   | New Sale — Payments        | Amount typed in the payment box is silently discarded on Complete; order posts as unpaid    | P-002    |
| BA-0003 | S2  | FLOW   | New Sale — right rail      | Complete button moves up 43px on payment-method change, under a cursor aimed at Add payment | P-003    |
| BA-0004 | S2  | FUNC   | New Sale — Items           | Quantity of 0 or negative silently deletes the line                                         | P-004    |
| BA-0005 | S2  | FUNC   | New Sale — Order details   | Past delivery dates accepted, and reported as having capacity                               | P-005    |
| BA-0006 | S2  | FUNC   | New Sale — Items           | No upper bound on quantity; 999999 yields a $1.4B order                                     | P-004    |
| BA-0007 | S2  | ERROR  | New Sale — Customer        | Customer-form errors render in the right rail, ~500px away                                  | P-006    |
| BA-0008 | S2  | COPY   | New Sale — Customer        | Validation copy exposes internal API field names                                            | P-006    |
| BA-0009 | S2  | A11Y   | New Sale                   | 15 of 28 inputs have no programmatic label                                                  | P-007    |
| BA-0010 | S2  | A11Y   | Add Product modal          | Product rows unreachable by keyboard; order entry impossible without a mouse                | P-008    |
| BA-0011 | S2  | A11Y   | Add Product modal          | No dialog role, no focus trap, Escape does not close                                        | P-008    |
| BA-0012 | S2  | DESIGN | New Sale / Order detail    | Line grid overflows; item name and line amount never visible together                       | P-009    |
| BA-0013 | S2  | PRINT  | Invoice                    | Salesperson prints as a single letter                                                       | P-010    |
| BA-0014 | S2  | PRINT  | Invoice, Delivery ticket   | ZIP stored but omitted from every printed address                                           | P-010    |
| BA-0015 | S2  | DATA   | Totals vs Invoice          | "Merchandise" means $1,000.00 on screen and $1,018.00 on the invoice                        | P-011    |
| BA-0016 | S2  | DATA   | Orders list                | Cancelled orders keep a non-zero Balance Due                                                | P-012    |
| BA-0017 | S2  | COPY   | List / detail / filter     | Same order has three different status words                                                 | P-013    |
| BA-0018 | S2  | FUNC   | Orders list                | No column is sortable                                                                       | P-014    |
| BA-0019 | S2  | DATA   | Add Product modal          | Every product prices at $0.00                                                               | P-015    |
| BA-0020 | S2  | DATA   | New Sale — Order details   | Salesperson dropdown contains a blank selectable option                                     | P-016    |
| BA-0021 | S2  | FUNC   | New Sale — Items           | Special-order warning disappears when a draft is reopened                                   | P-017    |
| BA-0022 | S3  | ERROR  | New Sale — right rail      | Validation errors never clear, even on success                                              | P-006    |
| BA-0023 | S3  | DESIGN | Orders list                | 59px rows, no sticky header — 11 rows at 1440×900                                           | P-018    |
| BA-0024 | S3  | FUNC   | Orders list                | Filter and search not in the URL; lost on reload                                            | P-014    |
| BA-0025 | S3  | DESIGN | Orders list                | No-results state is one sentence with no way out                                            | P-019    |
| BA-0026 | S3  | FUNC   | New Sale — Totals          | Over-large discount silently clamped                                                        | P-020    |
| BA-0027 | S3  | FUNC   | New Sale — Payments        | Add payment with an empty amount takes the full balance                                     | P-002    |
| BA-0028 | S3  | PRINT  | Delivery ticket            | Recycling fee listed as an item to load                                                     | P-021    |
| BA-0029 | S3  | PRINT  | Pick list, Delivery ticket | No barcode on either document                                                               | P-021    |
| BA-0030 | S3  | PRINT  | Invoice                    | Customer # is a fragment of the internal record id                                          | P-010    |
| BA-0031 | S3  | COPY   | Confirmation, Order detail | Development roadmap copy shown to end users                                                 | P-022    |
| BA-0032 | S3  | PERF   | All                        | ~6 of 43 requests per page view return 503; all link prefetches                             | P-023    |
| BA-0033 | S3  | DESIGN | Orders, Sales              | Two lists, three different conventions                                                      | P-018    |
| BA-0034 | S3  | DESIGN | Sales list                 | Raw locale timestamps; three identifier formats in one column                               | P-018    |
| BA-0035 | S3  | DESIGN | Order detail               | Five equal-weight header actions, no primary                                                | P-024    |
| BA-0036 | S3  | A11Y   | New Sale                   | Draft chips take the first six tab stops                                                    | P-008    |
| BA-0037 | S3  | DESIGN | New Sale                   | Numeric inputs too narrow to display their values                                           | P-009    |
| BA-0038 | S3  | FLOW   | New Sale                   | Completing a draft cancels it and issues a new order number                                 | P-012    |
| BA-0039 | S3  | ERROR  | Order not found            | Error page has no page chrome                                                               | P-019    |
| BA-0040 | S4  | DESIGN | New Sale                   | Success toast covers the global Open register button                                        | P-022    |
| BA-0041 | S4  | COPY   | Invoice                    | Payment method prints lowercase                                                             | P-022    |

## Cross-session watch list

Carried into later sessions:

- **S03 (settlement):** BA-0002, BA-0016, BA-0027, BA-0038 all touch money state. Financing tenders (Synchrony, Acima) were filed BLOCKED-BY-SAFETY in S01 and need a confirmed test-gateway configuration.
- **S05 (fulfilment):** BA-0005 puts past dates into the delivery queue; BA-0021 and BA-0028 affect what the warehouse and the driver see.
- **S15 (printing):** BA-0013, BA-0014, BA-0029, BA-0030 are all document-template field mapping. Multi-page pagination and repeated headers were untestable in S01 — no order was long enough.
- **S16 (permissions):** no permission-gated control was visible anywhere in S01 under the owner role. The whole module needs a second pass once non-owner roles exist.
- **S17 (design pass):** BA-0012, BA-0023, BA-0033, BA-0034, BA-0035, BA-0037 are the S01 inputs to the redesign brief.
- **Audit hygiene:** no build or version identifier is visible anywhere in the app, so findings cannot be pinned to a build. Worth fixing before the queue gets much longer.
