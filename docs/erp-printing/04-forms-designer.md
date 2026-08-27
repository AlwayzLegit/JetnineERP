# 04 — The Forms Designer (Document Template Engine)

Covers: **Design Enhanced Laser Forms**, **Forms Designer Window**, **Toolbox Tab**,
**Copy Form Window**, **New Label Wizard**, **Test-Print Enhanced Laser Forms**,
**Enhanced Laser Processing Form Designation**.

---

## Read this first — the build recommendation

STORIS ships a full WYSIWYG banded-report designer (a rebranded DevExpress XtraReports —
`XRLabel`, `PictureBox`, band structure, and the Report Explorer/Properties panes give it
away). Seven of the twenty-eight articles in this section document that designer's UI.

**Do not rebuild the designer.** Rebuild the *model underneath it*:

- a template bound to a **named, versioned data contract** per document type
- **resolution** by (document type, location, language)
- **versioning** with mandatory change notes
- **copies and per-copy labels**
- **test rendering** with placeholder data

Author the templates themselves in whatever templating system the repo already uses (HTML →
PDF is the common modern answer, and it makes the label/thermal case tractable too). A
handful of documents authored by developers in version control beats a WYSIWYG editor that
generates unreviewable layout blobs — and the mandatory-change-note requirement below is
solved for free by git.

The one real argument for a designer is that store managers tweak forms without a deploy.
Weigh that against seven articles of surface area. If we do want end-user editing later,
the model above is what makes it possible; a slot-and-field editor over a
developer-authored template gets most of the value at a fraction of the cost.

The rest of this document specifies the model, and describes the designer only closely
enough to migrate from it.

---

## Design Enhanced Laser Forms — the Form Management model

**Entry:** System Administration > Print System Settings > Advanced Printer Settings >
Enhanced Laser Forms > Design Enhanced Laser Forms.

The delivered product includes many standard layouts (sales orders, purchase orders, checks,
credit card receipts, and more). Standard forms are usable as-is or copyable into editable
custom forms.

### Activation via Control Settings — the seam that turns the engine on

A document does **not** use a designed form just because one exists. The relevant Control
Settings record must select **Forms Designer** as the print method for that document.
Example from the source: to print sales-order documents such as exchange receipts, set the
*Sales Order* field on the *Printed Documents* tab of Point of Sale Control Settings to
Forms Designer.

Control files carrying a Forms Designer flag:

- Account Statement Cycling Control Settings
- Service Control Settings
- Purchasing Control Settings
- Quick Sale Control Settings
- Payables Control Settings
- Point of Sale Control Settings

Two POS settings extend what forms can carry:

- *ATP Calculation* settings (Logistics tab) allow **ATP and ATC dates** to print on Sales
  Order and Shopping Cart enhanced laser forms.
- *Product Image Option for Forms Designer* (Printed Documents tab) allows **images** in
  enhanced laser forms.

`[SETTING] simplify` — a per-document-type "which engine renders this" switch is pure legacy
migration scaffolding, needed only because STORIS had to run old and new rendering side by
side. We have one engine. Drop the switch; keep the two capability flags (ATP/ATC dates,
product images) as template-level concerns rather than global settings.

### Form Management grid — the columns are the data model

| Column | Behavior |
|---|---|
| **Form Type** | Expandable (`+`) to reveal the forms under it |
| **Description** | Editable in-grid **for non-standard forms only** |
| **User Modified** | User code of last editor |
| **Modified Date** | Date of last edit |
| **Default** | Checkbox. The form used when printing this form type — unless a location match wins. A new default can be set at any time |
| **STORIS Standard** | Checkbox, read-only indicator. **Standard forms cannot be edited**, only copied |
| **Locations** | Location codes bound to this form. On print, if the printing location appears here, this form wins over the default |
| **Copies** | Number of copies printed each time this document prints |
| **Copy Labels** | One label per line, e.g. "Customer Copy", "Store Copy" |
| **Form Notes** | Change notes. A bold "A" icon indicates notes exist |

### Copies and Copy Labels — the coupling to get right

Three facts, all from the source, that must hold together:

1. Copy Labels is free text, one label per line, **unbounded** in count.
2. The system prints **only** the number of copies in the `Copies` field.
3. For a label to appear, the template must contain the **`COPY_LABELS` data element**
   placed where the label should render.

So a user can enter five labels with `Copies = 2` and silently get two. The source's own
guidance is "you must coordinate that field with this one" — i.e. the system won't.

**Fix this in our implementation.** Make copy labels an ordered list whose length *defines*
the copy count (`copies = labels.length`, minimum 1), or validate that they match and refuse
to save otherwise. Silent truncation of a document's copy set is exactly the kind of thing
that surfaces as "the customer never got their copy."

### Form Notes — mandatory change history

On save, a **Save Form?** dialog requires a description of the changes before the form can be
saved and exited. *Yes* saves with the note; *No* exits without saving.

Notes are readable per-form via the Form Notes icon, and viewable inline for all forms via
**Configure View → Preview Notes**, which renders each form's notes as a row immediately
below the form.

Model as an append-only revision log (see `01`). Never a single overwritten field.

### Left pane — form groups and actions

Form groups, which determine what appears in the right pane:

| Group | Contents |
|---|---|
| **Design Standard Forms** | Print forms for most main features |
| **Design Label Forms** | A label designer, comparable to Label Matrix |
| **Design Addendum Forms** | Import purchase order addenda |
| **Insurance Letters** | Insurance acceptance and cancellation letters |

Actions: Design Form, Copy Form, Delete Form, and — for the Label group only — New Label
Wizard.

**Deleting** is restricted to user-created forms and shows a confirmation naming the form
type and description.

### Right pane

Lists form types for the selected group; expand a form type to see its forms. Only the
`Default`-flagged form is used per form type, except where `Locations` overrides.

---

## Copy Form Window

The only way to create a custom form.

1. Click **Copy Form** in the left pane of Form Management.
2. Select the source form by clicking its row.
3. Click into the **Description** box and enter a description for the new form.
4. Click **Copy**.

Result: you return to Form Management with the new form listed, showing the original form
type, the copying user's initials, and today's date in **Modified Date**. **`Default` and
`STORIS Standard` are both unchecked** — the new form is inert until explicitly activated by
checking `Default`.

(One source article words this as "Active and STORIS Standard columns remain unchecked" and
the other as "Default and STORIS Standard" — the grid column is `Default`; treat "Active" as
a stale synonym for the same flag.)

---

## Forms Designer Window `[LEGACY]`

Documented for migration recognition only.

Four regions: **Formatting Tools**, **Toolbox**, **Form Layout**, **Data Management**
(itself Data box / Report Explorer box, plus Properties box).

Formatting-tool tabs:

- **Report Designer** — the editing surface; the only tab where the Toolbox and Data
  Management panes are available; where saving happens.
- **Print Preview** — print layout with **placeholder data**, plus page setup. Offers
  **View Live Data** — replay against the data of the form's last actual print.
  `[GATE]` unavailable if the form was never printed, **or if the form contains sensitive
  data such as AP check information.**
- **HTML View** — the form as it would appear online.

`[LEGACY]` A **Select Designer Version** prompt appears when the workstation's designer
version differs from the server's ("SCI") version, with a recommendation to upgrade and a
warning that all workstations must then match. Pure thick-client deployment pain; it
disappears entirely in a server-rendered system.

### Data Management

- **Form Data** — the data elements available to this form type (for a sales order: customer
  name, sales tax, delivery charge, …), organized into expandable groups. Drag a field onto
  the layout to bind an `XRLabel` control to it.
- **Report Explorer** — a tree of every object in the form, organized by parent; selection is
  synchronized both ways with the canvas.
- **Properties** — property editor for bands and controls, grouped into categories
  (Appearance, Behavior, …). Right-click → **Reset** undoes a property change.

### Bands

The layout is **banded**, and this is the one structural idea worth carrying forward. To
place content in an empty band you must first expand it — e.g. drag the group header
(`grpHeader`) down below the `PageHeader` line to open the `PageHeader [one band per page]`
band, then drop the control in. A control in `PageHeader` prints at the top of every page.

Any replacement templating system needs the same vocabulary: page header, page footer, group
header/footer, detail band, repeated per page or per group.

### The migration-critical part

**Form Data is a per-form-type data contract.** That named set of elements — plus
`COPY_LABELS` — is what templates bind to, and it is the only piece of the designer that
must survive.

**Action for implementation:** for each document type we rebuild, define the data contract
explicitly (a typed view model), version it, and treat adding/removing fields as a
contract change. This is the thing that lets templates be authored independently of the
code that populates them, and it is the real product of this whole subsystem.

---

## Toolbox Tab

The control palette for the designer. Two interaction modes: click the control then click
the form to place it, or drag and drop.

Controls named in the source: **Label**, **barcode**, **check box**, **PictureBox** (image).
The source does not enumerate the full palette.

Placed controls can have their text replaced, their font family/size/style changed, and their
position adjusted.

**Barcode support is the item to note.** Order-number barcodes appear on delivery tickets
(see `06`) and drive the RF scanning workflow — barcode rendering is a hard requirement of
any template engine we choose, not an optional nicety.

---

## New Label Wizard

**Entry:** Form Management > *Design Label Forms* (left pane) > **New Label Wizard**.

Available **only** for the Label Forms group.

Labels created here are usable in these label print programs:

- Print Multiple Product Labels
- Print a Bar Code Floor Tag
- Print a Single Product Label

### Flow

1. **Choose the Label Style**
   - `Multi Column / Letter Size`
   - `Single Column / Scrolling Paper` — *use for Zebra printers*
2. **Select a label form type** (e.g. Hangtag) and enter a description distinguishing it from
   others of the same type.
3. **Label Information screen** — pick a pre-defined stock:
   - **Label Products** — the manufacturer (e.g. AOne, Avery)
   - **Product Numbers** — filtered by the selected manufacturer
   - If the needed stock isn't listed, click **Next** to define it manually.
4. **Customize screen** — **Page Size**, then: `Label Width`, `Label Height`,
   `Vertical Pitch`, `Horizontal Pitch`, `Top Margin`, `Side Margin`.
5. **Finish** returns to the Forms Designer.

### Build note

The two label styles are two genuinely different output paths: sheet-fed die-cut stock
(a grid of labels on a letter page, requiring the pitch/margin geometry) versus continuous
thermal roll (Zebra, one label per "page", typically ZPL). A single PDF pipeline handles the
first well and the second badly. Decide this early — thermal label printing is usually a
separate renderer, and retrofitting it is painful.

The label-stock catalog (Avery et al. by product number) is a convenience database. Seed it
with the handful of stocks we actually buy; don't port a vendor catalog.

---

## Test-Print Enhanced Laser Forms

**Entry:** System Administration > Print System Settings > Advanced Printer Settings >
Enhanced Laser Forms > Test Print Enhanced Laser Forms.

Purpose: verify **alignment** after modifying a form design.

Flow: the Test Print window lists all forms — standard and user-designed. Select a form type,
click **Print**. Destination follows the user's configured Print Settings for that form type
(default printer / specified printer / OS print dialog — see `03`).

**The test page contains no real data.** It prints `XXX`s for text fields and `999`s for
numeric fields, showing exactly where each value will land.

This is a good idea, cheaply implemented, and should be ported directly: render any template
with typed placeholder fill. It catches overflow and alignment problems without exposing
customer data to whoever is standing at the printer — which matters for checks and financing
documents.

`[LEGACY]` The article's "Alternate Print Dialogue Options" (printing to Microsoft Office
Document Image Writer or Adobe PDF as a pseudo-printer to preview on screen) are workarounds
for not having a preview. STORIS notes these render imprecisely and recommends a physical
test print for final verification. Irrelevant once preview is a first-class PDF render.

---

## Enhanced Laser Processing Form Designation

**Entry:** System Administration > Print System Settings > Advanced System Settings >
Enhanced Laser Forms > Enhanced Laser Processing Form Designation.

`[GATE]` Relevant only when **Multi-Lingual Processing** is active.

Purpose: bind ELP forms to specific **languages** at specific **locations** for specific
**document types**. Use only for locations that need a document type printed in a language
*in addition to* that location's default language.

### Fields

| Field | Behavior |
|---|---|
| **Location** | Arrow-select. Double-click a grid row to edit an existing designation |
| **Language** | Arrow-select from **active** languages |
| **Document Type** | Arrow-select from available document types |
| **ELP Form** | Arrow-select from available enhanced laser forms |
| **Add** | Writes the designation to the grid |

The grid displays Location, Language, Document Type, and ELP Form. Double-click a row to
edit or remove.

### Resolution

The grid is a lookup table consulted at print time:

- **Hit** on `(document type, location)` → use the designated form.
- **Miss** → use the form flagged Default via Design Enhanced Laser Forms.

Note the source describes the lookup key as document type + location while the entry form
also captures language — language selects *among* designations for a location, and derives
otherwise from the location's **Document Language**. Implement the full three-part key
`(document_type, location, language)` with language defaulting from the location; that is
consistent with both statements and is the only version that actually works for a location
serving two languages.

This override table plus the `Locations` column on the form itself gives the complete
resolution order in `01-architecture-and-data-model.md`.
