# Cowork runbook — STORIS invoice register PDF → sales + customers CSVs

Instructions for a Claude Cowork session that has been given access to a local
folder containing the STORIS **invoice register** export (a ~4 GB print-to-PDF
report). Goal: produce two **verified** CSVs that the Jetnine import wizard
(Settings → Import) accepts — `customers.csv` then `sales.csv` — for STORIS
cutover rehearsal #2.

## Hard rules

1. **The PDF and every derived file stay in the local folder.** Never upload
   the PDF, the extracted text, or the CSVs anywhere; never commit them to any
   repository. Only this runbook and (if useful) the parser script are repo
   material — data is not.
2. **Deterministic parsing only.** The parser is a script that can be re-run
   end-to-end and produce identical output (the final delta import re-runs it
   on a fresh export). No hand-editing of outputs; fix the parser instead.
3. **Do not OCR.** If the PDF has no text layer, stop and report — the fix is
   a re-export from STORIS, not OCR at this size.
4. **Verification gates below are pass/fail.** Do not declare the CSVs
   "workable" until every gate passes or the human has explicitly waived one.

## Step 0 — tooling

Preferred: `pdftotext` (poppler) — it streams and handles huge files with flat
memory. `brew install poppler` / `apt install poppler-utils`. Optional:
`qpdf` for splitting if pdftotext struggles. Fallback if neither installs:
Python `pypdf` page-range extraction (slower; process in 1,000-page windows).

## Step 1 — text-layer probe (fail fast)

```bash
pdftotext -layout -f 1 -l 5 register.pdf probe.txt && head -100 probe.txt
```

Readable fixed-width report columns → continue. Garbage or empty → **stop**:
the PDF is scanned images; report back that a re-export (delimited text, or a
24-month + open-documents subset per D8) is needed.

Also record the total page count (`pdfinfo register.pdf`).

## Step 2 — layout discovery

Extract ~50 pages from the start, middle, and end. Identify, and write down in
`layout-notes.md`:

- The **invoice block** shape: where invoice#, date, store/location code,
  customer account#, customer name/address/phone, invoice total, tax, and
  tender/payment method appear. Column positions matter (`-layout` preserves
  them) — parse by column slice or anchored regex, not by whitespace split.
- Page furniture to skip: report headers/footers, page numbers, column-header
  repeats, subtotal/grand-total blocks (keep those — they feed verification).
- How **credit memos / returns** print (negative amounts are usually
  parenthesized) and how voided invoices are marked.
- Whether the register prints **per-store subtotals** and a **grand total**
  (STORIS registers normally do — they are the verification anchor).

## Step 3 — full extraction

Stream in windows to keep memory flat, e.g. 10,000 pages per chunk:

```bash
pages=$(pdfinfo register.pdf | awk '/^Pages/{print $2}')
for ((f=1; f<=pages; f+=10000)); do
  l=$((f+9999)); ((l>pages)) && l=$pages
  pdftotext -layout -f $f -l $l register.pdf chunk-$f.txt
done
```

Concatenation order must follow page order. Expect this to take a while on
4 GB; that is fine.

## Step 4 — parser → CSVs

Write one script (Python recommended) that walks the chunks in order and emits
the two CSVs plus a reconciliation report. **Header-level only** — the import
wizard's `sale` entity is one row per invoice; line items are not imported.

### `sales.csv` — one row per invoice

Use exactly these headers (the wizard auto-maps them):

| Header     | Field             | Rules                                                                                                                                                                                                                                                                                            |
| ---------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `INVOICE#` | required, unique  | Duplicate invoice# in output = parser bug; investigate, never silently dedupe.                                                                                                                                                                                                                   |
| `CUST#`    | customer account# | Blank allowed (walk-in) — but then no customer link.                                                                                                                                                                                                                                             |
| `STORE`    | required          | **Mapped store NAME, not the code**: 88=`Warehouse`, 1=`Koreatown`, 2=`West LA`, 3=`La Brea`, 4=`Studio City`. Codes 06/08/09 are closed stores — **drop those invoices entirely** (count them in the recon report). Any other unmapped code: leave the row out, list it, report — do not guess. |
| `DATE`     | required          | `YYYY-MM-DD` (or `M/D/YYYY`; four-digit year preferred).                                                                                                                                                                                                                                         |
| `TOTAL`    | required          | Dollars with decimal point, e.g. `1234.56`. Negatives for credit memos/returns as `-1234.56` or `(1234.56)` — both parse. Never strip the sign.                                                                                                                                                  |
| `TAX`      | optional          | Same money format.                                                                                                                                                                                                                                                                               |
| `TENDER`   | optional          | Payment method text as printed (`CASH`, `VISA`, financing plan name, …).                                                                                                                                                                                                                         |

Voided invoices: exclude, count separately in the recon report.

### `customers.csv` — one row per distinct account#

Headers: `CUST#` (required, unique), `FIRST_NAME`, `LAST_NAME`, `PHONE`,
`ADDRESS1`, `ADDRESS2`, `CITY`, `STATE`, `ZIP`, `EMAIL` (whichever the
register actually carries — omit columns that never appear).

- Dedupe by account#. If the same account# shows conflicting details across
  invoices, keep the details from the **most recent** invoice and count the
  conflicts.
- Name splitting: registers usually print one name field. `LAST, FIRST` →
  split on the comma; plain `FIRST LAST` → last word is `LAST_NAME`; business
  names (no obvious split) → whole string in `LAST_NAME`, `FIRST_NAME` empty.
  Count how many rows took each path.
- Include customers from dropped-store (06/08/09) invoices **only if** they
  also appear on a kept invoice — otherwise leave them out (nothing would
  reference them).

## Step 5 — verification gates (all must pass)

Write results into `recon-report.md` with exact numbers:

1. **Grand-total tie-out (the critical one):** invoice count and $ grand total
   of `sales.csv` (kept rows) + dropped-store rows + voids must reconcile to
   the register's own printed grand totals **to the cent**. If the register
   prints per-store subtotals, tie each store the same way.
2. **Page coverage:** pages processed = `pdfinfo` page count; every page is
   either parsed or explicitly classified as furniture. Unparsed/unclassified
   lines = 0, or each one listed with page number.
3. **Referential integrity:** every non-blank `CUST#` in `sales.csv` exists in
   `customers.csv` (the wizard validates this; customers import first).
4. **Field sanity:** 0 rows with unparseable money/date; date range min/max
   printed and plausible; no duplicate `INVOICE#`; store value distribution
   listed (only the five mapped names may appear).
5. **Spot-check pack:** extract 20 random invoices' raw text blocks verbatim
   into `spot-check.txt` next to their parsed CSV rows, for the human to
   eyeball (this is recon gate 5 material).

## Step 6 — deliverables

In the working folder: `customers.csv`, `sales.csv`, `recon-report.md`,
`spot-check.txt`, `layout-notes.md`, and the parser script. Tell the human the
headline numbers: invoices kept / dropped (by reason) / voided, distinct
customers, $ grand total, date range — those figures get checked against the
in-app recon report after import (customers first, then sales, both via
Settings → Import).

## Context (for the Cowork session)

- Jetnine is the STORIS replacement; the import wizard stages CSV → column
  mapping → validation → idempotent commit (safe to re-run; decision D7).
- Imported sales are history only — flagged `imported_at`, excluded from cash
  drawer/commissions/webhooks (decision D8). Money is integer cents
  server-side; the CSV carries dollars and the importer converts.
- The staging QA tenant is the target for rehearsal #2; production gets a
  fresh final run at cutover (decision D11). Old stores 06/08/09 are out of
  migration scope — final (D12).
