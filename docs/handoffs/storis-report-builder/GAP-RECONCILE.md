# Report-builder pack — gap reconcile vs the shipped report catalog

Authored 2026-08-27 for task #28. Short, because the whole pack hangs
on one owner decision the module-layer SOM spec already raised
(`docs/erp/13-open-questions.md` #16).

## 1. What exists

Jetnine ships a **fixed report catalog**, not an authoring system: the
sales-views program's 13+ endpoints (sales summary, receipts, tax,
jeopardy, gift liability, date changes, merchandising, adjustments,
customer purchases…), each with CSV export + provenance headers,
announced caps, permission guards, and store-level data scoping. New
reports are added by code, on request, in about a slice each — the
whole current catalog was produced that way in one sprint.

The pack instead specifies STORIS' end-user authoring system: source
files + typed dictionaries (incl. computed and joined), five-tab
definition editor, prompts/filters, seven output destinations, a grid
viewer, three security layers with field masking, scheduling, and menu
integration — plus `12-open-questions.md`'s 20 semantic edges (join
fan-out, masking of aggregates, versioning, retention…), most carrying
sound recommendations we would adopt as written.

## 2. The decision that gates everything

**Q1 (owner): who authors reports?**

- **(a) Keep the fixed catalog** — store managers ask, reports get
  added by code within a day, permissioning and money-correctness stay
  reviewed. Zero build cost. This is the recommendation while the
  store count is small and requests are infrequent.
- **(b) Build the self-service builder** — a genuine multi-slice
  program (metadata layer over the Drizzle schema, definition CRUD,
  runner with masking-aware aggregation, exports, scheduling via the
  jobs runner, viewer UI). Choose this only if ad-hoc authoring by
  non-engineers is a real, recurring need.
- **(c) BI on a read replica** — connect an off-the-shelf BI tool for
  ad-hoc analysis and keep the catalog for operational reports. Middle
  cost; needs a replica + tool subscription and its own row-level
  security story (memberships' store scoping does not automatically
  follow the data out).

Sub-questions only if (b): adopt all of `12`'s recommendations as
written? (AND-only filters, sort-order break nesting, mask aggregates
whose inputs are masked, formula dictionaries inherit input security,
version-pinned archives, soft delete, skip-and-alert missed runs —
each is the safe choice and none needs business input.)

## 3. If (a) or (c)

Nothing further to build from this pack; `11-acceptance-tests.md` is
retired, and report requests continue through the catalog process. The
pack stays as reference for what a future builder must honor —
especially `07`'s field-security model, which any BI-replica route must
re-implement before it touches cost or customer data.
