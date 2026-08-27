# 09 — Surfacing reports in navigation

Sources: *Adding Report Builder Reports & DTS Views to Menus*, *Set Up Menus*.

A saved report definition is invisible until it is reachable. STORIS solves this in two steps:
publish to a staging menu, then place it on real menus.

---

## Step 1 — the USER-DEFINED menu

- Report Builder reports and **Dynamic Tab Select (DTS)** inquiries must first be added to the
  **USER-DEFINED** menu. That menu lists every such user-authored item and is the pool the menu
  editor draws from.
- To add an item: open it in Create a Report and **Save**. If a prompt asks whether to add it to the
  USER-DEFINED menu, answer **Yes**.
- If the prompt does not appear on save, the item is already there.
- **The prompt reappears on every save until answered Yes.**
- Answering Yes triggers a second, optional prompt: **`User Defined Menu Description`** — lets you
  give the menu entry a different label from the Report Builder entry, so the two versions are
  distinguishable.

**Our analogue:** a `published` flag on the report definition plus an optional `menu_label`.
The nagging re-prompt is a reasonable pattern (it keeps the option discoverable) but should be
dismissible with "don't ask again for this report".

## Step 2 — Menu Builder ("Set Up Menus")

Access: `System Administration → System Settings → System Permissions → Set Up Menus`.
Opening it raises a **User Authentication** window — a second authentication layer protecting the
menu system.

### Model

- Menus are trees that provide access to routines.
- **You must associate a user group with each menu, and each user group may have exactly one menu.**
  This is the core constraint: *menu ⟷ user group is 1:1*.
- Access to menus is restricted through the User and User Group files.
- Ships with standard menus (e.g. the **STORIS Business Menu**, containing everything organised
  generically; plus role-shaped ones such as a **Service Staff** menu that exposes only what a
  service rep needs).
- **Standard menus cannot be edited** — use as-is, or clone and edit the clone. Read-only and
  vendor-standard menus are flagged as such in the menu selection list.
- A separate **Quick Launch Menu** exists for frequently used routines.

### Three panes

1. **Toolbar** — New, Save, Cut/Copy/Paste/Delete Item, Move Item Up/Down, Add Root Menu /
   Add Sub-Menu, Expand All / Collapse All, Export Menu, View All Paths, Copy Path.
2. **Menu Tree** — the selected menu's structure, expandable/collapsible, loads fully collapsed.
3. **Program List** — every program in the system, filterable/groupable/sortable much like the
   report viewer grid (`06`). Drag items onto the tree to create shortcuts.

### Creating a menu

`New` → the New Menu window lists **user groups that have no menu yet**. (If none appear, create a
user group first.) Then either:
- **Copy From Existing Menu** — select a base menu, then `Create New Menu`; or
- **Empty Menu** — then `Create New Menu` for a blank tree.

The new menu adopts the user group's name.

*Multi-Lingual Processing:* the New Menu window lists only user groups whose `Language Code` matches
the language of the STORIS Login ID used to open the Menu Builder. (That Login ID — the `Logon ID`
field on the User file's Security tab — is not necessarily the same as the User ID entered at the
User Log In window.) Likewise, when editing, you can only reach menus translated into your language.

### Editing

- Pick a menu from `Menu Selection`. A check in **Read-Only** or **STORIS Standard** ⇒ view only.
- Node types: **menu options** (containers for sub-menus and shortcuts) and **program shortcuts**
  (leaves pointing at a routine). Unlimited nesting.
- Click or right-click → Edit to rename a node inline.
- `Add Sub-Menu` is enabled only when a **menu option** is selected — disabled on a program shortcut.
- `Move Item Up`/`Down` reorders within a level; moving between levels uses Cut and Paste.
- Copying a menu option copies its whole subtree (sub-menus and shortcuts).
- **Renaming a program shortcut renames every shortcut with the same program ID throughout the tree,
  and updates the Program List entry.** A global rename — surface that clearly before committing.
- Any edit arms the Save state; navigating away prompts to save or abandon.
- `Export Menu` → `Print Preview`, `HTML`, or `PDF`.

### Program List columns

| Column | Meaning |
|---|---|
| `Program Shortcut` | The display name (vendor default, editable) |
| `Program Type` | `Entry` · `Inquiry` · `Report` · `Form Print` |
| `Program Family` | `Sales Order` · `Purchase Order` · `Report Builder` · `DTS` · … |
| `FastKey` | Not available in the current release |
| `Program ID` | The actual program name |
| `ID` | Internal numeric identifier within the menu system |

`View All Paths` lists every menu path leading to a selected routine (this is how the ~18 access
paths on Run a Report are discoverable); `Copy Path` copies them to the clipboard.

---

## Guidance for our ERP

- **Keep the 1:1 menu-to-user-group constraint** if you want menus to be a real permission-shaped
  surface. It is restrictive, but it makes "what can this role see" answerable.
- Menu placement is **not** a substitute for permissions. A shortcut a user cannot run must still be
  blocked by `07`; hiding it is a usability nicety.
- `Program Type` / `Program Family` are the right facets for a searchable command palette. A modern
  client should offer search over the program list *and* the tree — the tree alone does not scale to
  a list the docs themselves describe as "long".
- Keep `View All Paths`. In a deep menu tree, "where does this live" is a constant support question.
