## Sales Views Phase 1 — store-level data scope (2026-08-27)

Owner-confirmed decision 2 built as substrate before any report work:

- `memberships.data_scope` ('all' | 'store', migration
  0060_membership_data_scope); a 'store' member's visible locations come
  from the previously-dormant `membership_location_scopes` table, loaded
  once per request into the tenant context by the tenancy guard.
- `salesScopeCond()` (`apps/api/src/common/sales-scope.ts`) — one WHERE
  fragment ANDed into every sales-dollar surface: orders list, POS sales
  list, cash-shifts list, reports sales/daily + by-product + by-category,
  the Z-report (all five sub-queries incl. the tender COALESCE), and the
  morning dashboard. Empty scope list = FALSE (fail closed, never open);
  a caller-requested locationId outside scope intersects to zero rows.
- Members page: per-member "Sales data" control (All locations / Their
  store only + store checkboxes, warning when none selected); PATCH
  /v1/business/members/:id accepts dataScope + scopeLocationIds
  (validated against the business, audited before/after).
- reports.int.spec +7 tests (owner-vs-scoped diff = exactly the other
  store's dollars; out-of-scope Z request → zero; empty scope → nothing;
  scope restore round-trip). 21/21.

Also committed the **STORIS Selling Location pack** (8 files,
`docs/erp-selling-location/` — 4 independent tracks + a shared lookup
control per its README; queued). Note: container restart had wiped 17
per-suite test DBs (jetnine_admin …) — recreated; full `pnpm test` green.
Gates by exit code: typecheck 0 · lint 0 · test 0 · build 0 · prettier 0.
