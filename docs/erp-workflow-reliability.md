# ERP workflow reliability

Requested by the owner on 2026-09-06 after a read-only review of the live ERP.
Extend the existing role dashboards, order notes and nightly jobs.

## First implementation slice

- Delivery jeopardy includes physical stock/special-order demand only. Custom
  charges never become unknown-product shortages. Preserve a deleted product's
  order-line description. Use the actual stock source when matching supply.
- Next-action guidance handles fully returned orders and each fulfillment method.
  A returned display status must never tell staff to collect a balance. This does
  not rewrite historical payments, returns, or accounting balances.
- Jobs distinguish completed, disabled, blocked and partially completed work.
  Previously misreported GL runs can resume after mappings are corrected; already
  posted journal families must not be duplicated. Technical run details remain
  inspectable; status normalization does not rewrite old rows until a retry.
  Failed scheduled reports are run individually to avoid repeating archives.
- Deleted purchase-order drafts no longer suppress automatic replenishment.

## Subsequent workflow slices

Shared tasks on orders, relevant member notifications, deadlines and coverage;
role-specific task queues; readiness-driven delivery and customer updates.
Add explicit physical-item/service-fee classification before repairing catalog
fees that were imported as stock. Review inactive/discontinued mappings and
preserve historical transactions and inventory movements during cleanup.
Keep the existing single-screen New Sale and manual fee entry. Do not restore
discount approval popups (owner amendment A10). Customer and vendor messages are
not sent as part of development or verification.

## Verification

Regression coverage for custom charges versus physical shortages, source-location
matching, returned and pickup/direct-ship next actions, and blocked GL retries.
Run repository format, lint, typecheck and the relevant tests before review.
Use isolated test data; do not reset or reconcile the live tenant.
