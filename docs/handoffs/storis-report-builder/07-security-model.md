# 07 — Security model

Sources: *Report Builder Security Overview*, *Establish Report Builder Security Groups*,
*Establish Report Builder Security Codes*, plus the `Access` field on Create a Report and the
`Access Archived Reports` permission on Create a User.

Three independent layers. They compose; none supersedes another.

---

## Layer 1 — report-level `Access` (set by the report's creator)

The `Access` field on the builder's Headings tab. Three values:

| Value | Effect |
|---|---|
| `Anyone Can Run` | No restriction — all users may edit **and** run the report |
| `Within Staff Type` | Run and edit limited to users sharing the **owner's staff type** |
| `Only the Owner` | Only the creating user |

Simple, author-controlled, and combinable with layers 2 and 3.

---

## Layer 2 — file security groups (source-file level)

**Enabled by:** a checkbox on the **Security tab of General System Control Settings**. Report Builder
Security is off until this is set.

**Maintained in:** *Establish Report Builder Security Groups*
(`System Administration → System Settings → System Permissions`).

### Model

A **file security group** is a named set of one or more source files.

| Field | Rules |
|---|---|
| `File Security Group ID` | Up to **10 alphanumeric characters**. Search opens a lookup. |
| `File Group Description` | Text |
| `File Name` | Add a source file to the group; `Add` puts it in the grid. Repeat for more. |
| `Description` | Read-only description of the selected source file |
| Grid | Existing member files. Double-click loads a row into `File Name`; `Remove` deletes it. |

**Actions → `Clone This Group to a New Name`.**

### The polarity — read this twice

A file security group **restricts**. Membership in the group means *this file is locked*.
A **checked box** against that group in a user's User file **grants** access — it *overrides* the
restriction.

Consequences:
- Shipping a group named **Standard Files (STD)** containing *every* source file means **every user
  starts fully restricted from every Report Builder report**.
- **A user must have at least one file security group checked in their User file to run any Report
  Builder report at all.** With no boxes checked, the system blocks them from the Run a Report
  routine entirely.
- Granting the Standard Files group = unlimited access to all Report Builder reports.
- The Standard Files group **cannot be edited**. The documented starting move is to clone it and
  edit the clone.

### Worked example from the docs

Restrict everyone except yourself from `ORDER.ITEM`:
1. Create a group.
2. Add `ORDER.ITEM` to it via `File Name`.
3. All users are now restricted from `ORDER.ITEM` (unless another group they hold — such as Standard
   Files — grants it).
4. In *your* User file, check the box for the new group. That overrides the restriction **for that
   group only**.

### Enforcement
If a user opens a Report Builder report whose source file they are restricted from, an error appears
and **access is denied** — the whole report, not just a column.

> **Doc inconsistency to resolve.** The STORIS articles are not consistent about *where* the override
> checkboxes live: the security-overview article says the **Staff file**, while the security-groups and
> security-codes articles say the **User file** (and both mention user-group-level grants). Treat the
> grant as an attribute of the **user identity record**, however that is modelled in our repo, with
> user-group inheritance — and pick one term and use it everywhere in the UI.

---

## Layer 3 — field security codes (field level)

**Maintained in:** *Establish Report Builder Security Codes*
(`System Administration → System Settings → System Permissions`).

| Field | Rules |
|---|---|
| `Field Security Code` | The code. Existing codes list in the grid; `Add` creates, double-click edits, `Remove` deletes. |
| `Field Code Description` | Up to **25 alphanumeric characters** |

### How a code attaches to data

A field security code is **not bound to any field until you apply it**. The binding happens in
*Maintain Report Dictionaries* (`03`) via that screen's `Security Code` field:

1. Create the code here (e.g. "Product Number").
2. In Maintain Report Dictionaries, open the source file containing the field.
3. Double-click the dictionary in the grid to select it.
4. At `Security Code`, search and pick the code from step 1.
5. `Add`.

Result: **all** employees are now blocked from that field's data in **all** Report Builder reports.
Grant individuals access by checking the code in the `Field Security Code` field of their User file
(or at user-group level).

A code can be detached from one field and immediately attached to another. Its two functions:
- identify the field(s) whose data is restricted, and
- identify (via the Staff file) the employees restricted from that data.

### Enforcement — the important part

> *"the column header appears in the report but the column is empty."*

Field restriction is a **masking rule at render time**. Do not drop the column, do not filter rows,
do not fail the run. This makes reports layout-stable across users with different entitlements.

### Ships-with example
STORIS delivers a **Cost** field security code, pre-applied to the cost-bearing fields. Cost data is
therefore hidden from everyone except users with the Cost code checked. Ship an equivalent for cost
and margin data on day one.

---

## Staff type inheritance

When a staff member is created, the `File Security Group` and `Field Security Codes` settings on
their **Staff Type** record are copied into their Staff/User record. This is a **copy at creation,
not a live link** — later changes to the staff type do not propagate.

Implement it that way (it is predictable and auditable), but surface the drift: an admin view showing
which users diverge from their staff type's template.

---

## Scope limit

**Report Builder Security does not apply to regular (non-Report-Builder) reports.** Standard reports
have their own permissions. Our ERP should not repeat this split — but be aware that anything ported
from a STORIS standard report carries no field-level masking with it, and needs its own.

---

## Adjacent permissions worth cataloguing

| Permission | Governs |
|---|---|
| `Access Archived Reports` (Security tab, Create a User) | Which archived reports a user sees in Review Archived Reports |
| `Edit Personal Report Viewer Corporate Views` (user / user-group) | Saving and deleting corporate grid views (`06`) |
| Report Builder Security master switch (Security tab, General System Control Settings) | Turns layers 2 and 3 on |
| `Report Retention Days` (General System Control Settings) | Archive lifetime (`05`) |
| `Start Scheduler Phantom` (General System Control Settings) | Whether scheduled reports run at all (`08`) |

---

## Implementation checklist

- [ ] `can_view_definition(user, report)` — layer 1
- [ ] `can_run(user, report)` — layers 1 + 2, evaluated **before** the report appears in any picker
- [ ] `visible_fields(user, report)` — layer 3, applied at render as masking
- [ ] Deny-by-default: a user with no granted file groups can run nothing
- [ ] One evaluation point per layer, called from builder, runner, scheduler, and archive alike
- [ ] Every grant/restriction change is audit-logged with actor and timestamp
- [ ] Archived reports re-check entitlements **at view time**, not only at generation time
