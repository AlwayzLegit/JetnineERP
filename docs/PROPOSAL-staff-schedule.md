# PROPOSAL — Staff schedule (who works where, who is in the store now)

Status: **scope proposal — awaiting owner approval (2026-09-03).**

Owner ask: "add staff schedule in the system to manage and actively know their schedule and
person in store."

## What exists today (reused, not rebuilt)

- Staff = `memberships` (user, role, status, `data_scope` / `selling_scope`, approved stores
  via `membership_location_scopes`) — `packages/db/src/schema/tenancy.ts:114-199`.
- Stores = `locations` with a `timezone` (`tenancy.ts:15-30`).
- "Actually in the store" signals already recorded: open cash shift (`cash_shifts.opened_by_user_id`,
  `location_id`, `closed_at IS NULL`), sales rung today (`orders.salesperson_membership_id`,
  `sales.*`), last login. No time clock exists.
- UI patterns: the deliveries calendar (Sunday-start week grid, drag to reschedule,
  `apps/web/src/app/(business)/deliveries/page.tsx`), Members page, dashboard / manager
  dashboard / My Day cards.

## Proposed scope (vertical slice)

**Schema** — `staff_shifts` (tenant table, RLS, indexes): `id`, `business_id`, `location_id`,
`membership_id`, `starts_at`, `ends_at` (timestamptz, entered in the store's timezone),
`role_label` (e.g. Sales, Manager on duty, Warehouse), `notes`, `status`
(`scheduled` | `cancelled`), `created_by_membership_id`, timestamps. Unique guard: no
overlapping shift for the same member. Migration + `rls.sql` entry.

**API** (`apps/api/src/staff-schedule/`, `@TenantScoped`, audit on every mutation):

- `GET /v1/staff-schedule?from&to&locationId` — shifts for a range (members honour
  `data_scope`).
- `POST` / `PATCH /:id` / `DELETE /:id` — manage shifts; `POST /copy-week {from, to}`.
- `GET /v1/staff-schedule/on-duty?at=` — per store: who is scheduled right now, plus the
  live signals (open cash shift, sales rung today, last seen) so "scheduled but not in" is
  visible.
- Permissions: `staff_schedule.view` (Owner, Manager, Operations, Cashier, Warehouse),
  `staff_schedule.manage` (Owner, Manager). Seeded into system roles.

**Web**

- `/schedule` (nav under People): week grid per store — rows = staff, columns = days;
  click a cell to add/edit a shift; store picker; "Copy last week"; print view.
- "On duty now" panel on the Dashboard and the store-manager dashboard, and a
  "My shifts this week" card on My Day.
- Members page: link to the member's shifts.

**Tests** — `apps/api/test/staff-schedule.int.spec.ts` (overlap guard, scope filtering,
on-duty computation across timezones, copy-week), e2e smoke for the grid.

Estimated size: one PR, ~2 sessions.

## Questions for the owner (answer with the approval)

1. **Time clock too?** Schedule only (this proposal), or also clock-in / clock-out on the
   register so "in store" is a punch, not a schedule? (Clock-in would be a second slice.)
2. **Who sees what?** Can every staff member see the whole store's schedule, or only their
   own shifts (Owner/Manager see all)?
3. **Repeating weeks?** Is "copy last week" enough, or do you want fixed weekly templates
   per person (e.g. Maria: Tue–Sat 10–7 at West LA)?
4. **Enforce it?** Should the register block ringing a sale at a store where the member is
   not scheduled today (on top of the existing selling scope), or only report it?
