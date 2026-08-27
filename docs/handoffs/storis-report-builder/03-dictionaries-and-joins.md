# 03 — Dictionaries and joins

STORIS names: *Maintain Report Dictionaries (Query Wizard Dictionary Maintenance)* and the
*File Join Assistant* reached from its Actions menu.

This is the metadata layer the whole feature stands on. Build it first.

---

## Why dictionaries exist

Report authors must never touch physical columns. A dictionary is a **stable, named, typed,
pre-formatted projection** over a source file. It carries display metadata (heading, width,
justification, numeric/date conversion), validation metadata (`on_file`, `specific_edits`),
computation (`formula`), and security (`security_code`).

Two consequences worth designing for:

- The physical schema can change without breaking saved report definitions, as long as the
  dictionary keeps resolving.
- Field-level access control has exactly one place to live.

---

## Maintain Report Dictionaries

Reachable standalone from every module's Report Builder menu, **or** from Create a Report →
Actions → *Edit Dictionaries* (in which case `File Name` is pre-filled and locked).

### Fields

| Field | Rules |
|---|---|
| `File Name` | The source file whose dictionaries are being edited. Locked when entered from the builder. The grid below lists that file's existing dictionaries. |
| `Dictionary Name` | Type a new name or pick from the grid. With an existing name selected, an action opens the **Dictionary Clone** window: copies all attributes to a new name, **max 15 characters**. |
| `Description` | Text description of the dictionary. |
| `Column Heading` | Default text at the top of the report column. This is the single place headings are edited. |
| `Prompt Name` | Reference-only identifier used when this dictionary drives a run-time prompt. |
| `Width` | Default character width. Per-report override lives on the builder's Output tab. |
| `Conversion` | Display format for numeric/date data — decimal places, 2- or 4-digit year, etc. |
| `Attribute` | Physical attribute/field number within the file. **Used only when `Dictionary Type = Direct Attribute`.** |
| `On File` | A file checked against to confirm the dictionary's value exists. A referential-integrity hint — use it to drive lookup widgets and validation. |
| `Formula` | The calculation. **Used only when `Dictionary Type = Formula`.** |
| `Justification` | `Left` (first char at left edge) · `Right` (last char at right edge) · `Centered`. |
| `Dictionary Type` | `Direct Attribute` (pairs with `Attribute`) or `Formula` (pairs with `Formula`). |
| `Specific Edits` | Builds the closed list of acceptable answers when this dictionary is used to prompt. |
| `Security Code` | A field security code (see `07`). Setting one **restricts every user by default**: the column header renders, the data does not. Access is then granted per-user via the Field Security Group checkbox in the User file, or at user-group level. |

### Grid behaviour

Selecting a valid file lists its dictionaries. Double-click a grid row to load it into the fields;
`Remove` deletes it. Newly added dictionaries insert into the grid **in alphabetical order**.

### Implementation notes

- Model `Dictionary Type` as a discriminated union, not two nullable columns that can both be set.
- `Formula` needs a real expression evaluator with a **closed function set** and dictionary-name
  resolution scoped to the source file. Do not evaluate arbitrary code. This is the highest-risk
  surface in the whole feature.
- `Conversion` is a formatting spec, not a cast. Keep the underlying value typed; apply conversion
  at render time so aggregation and export stay correct.
- Setting `security_code` is a **deny-by-default** action with broad blast radius. Require
  confirmation and log it.

---

## File Join Assistant

Access: Actions button at the bottom of Maintain Report Dictionaries.

### What it does

Copies a dictionary from a *secondary* source file onto a *primary* one, so a report rooted at the
primary file can display the joined field. Example from the docs: the `Order` source file gains a
`Warehouse Location` dictionary so sales-order reports can show it.

The copy is **permanent** — once joined, the dictionary is an ordinary member of the primary file
and usable by any report built on it.

### Procedure (implement this exact sequence)

1. On Maintain Report Dictionaries, set `File Name` to the **primary** (host) source file. Its
   current dictionaries list in the grid.
2. Enter a **new, unique** `Dictionary Name` for the incoming dictionary.
   *If the name matches a STORIS-original dictionary on that file, error out before the assistant
   opens.* The rename-on-copy is what protects the original's integrity.
3. Actions → File Join Assistant.
4. `Join File Name` — pick the **secondary** source file that holds the dictionary you want. Only
   files with a *relation* to the primary (i.e. sharing a common dictionary) are listed.
5. `Join File Field Name` — pick the dictionary to graft. Enabled only after step 4.
6. Save → returns to Maintain Report Dictionaries with the joined dictionary's attributes loaded
   under the new name. Adjust anything (heading, width, justification…), then Add.
7. The dictionary appears in the grid, alphabetically, and is now permanent.

### Constraints to enforce

- Eligible join sources are **derived from the relation graph**, not a free list. Build and expose
  that graph explicitly; it is also what lets you generate the actual join at query time.
- STORIS restricts certain key dictionaries from selection to protect data integrity — "you may not
  be able to select from all dictionaries at all times." Model as a per-dictionary
  `joinable` / `selectable_in_builder` flag.
- A join defines a **cardinality risk**: a one-to-many relation silently multiplies rows. The docs
  do not address this. Decide and document your semantics (first-match vs. row fan-out) — see `12`.

---

## Machine-generated source files: Build a Report File

Two articles document a pattern worth copying: the buyer's worksheet can **materialise its working
data as a report source file**.

- *Product Selection → Actions → Build a Report File* saves the Product Performance and Purchase
  Recommendations (Full Buyer's Worksheet) data to a file named `BMW.WORK.DATA`.
- On selection the system asks: *"Should AAA's previous data be cleared before generating new
  data?"* — Yes clears and regenerates · No appends/regenerates without clearing · Cancel aborts.
- The generated file is **keyed by the logged-in user's initials**, so concurrent users never
  overwrite each other's working set.
- Afterwards, authors build reports normally against the `BMW.WORK.DATA` source file.

### Why this matters for our ERP

It is a general escape hatch: *any* complex interactive analysis can drop a per-user snapshot into
the report source catalog and become reportable, without adding a first-class table. Generalise it:

- A `WorkingDataSet` source-file kind, scoped by owner, with a generation timestamp.
- Explicit clear-vs-accumulate semantics on regeneration.
- A retention policy — the docs specify none, which is how these files rot. See `12`.

*(The same Actions menu also carries **Display PO Create Summary**, which lists products to be
ordered before POs are created — vendor, receiving warehouse, scheduled date, product/model, quantity
ordered, cost, extended amount, and a `PO` column showing how many POs will be created and how
products group onto them. Double-clicking a line opens Create PO. Out of scope for the reporting
module; noted because it shares the Actions menu.)*
