import { BadRequestException } from '@nestjs/common';
import { and, sql, type SQL } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import {
  DefinitionValidationError,
  validateDefinition,
  type ReportDefinitionDoc,
  type ReportFilterDef,
  type UserDictionaryShape,
} from './definition';
import { evaluateFormula, FormulaError, parseFormula } from './formula';
import {
  getSystemDictionary,
  joinedExpr,
  type ReportSource,
  type SystemDictionary,
} from './report-sources';

/** Row cap (pack 12 rec #7): announced, never silent. */
export const ROW_CAP = 5000;

export type CellValue = string | number | boolean | null;

export interface RunColumn {
  name: string;
  heading: string;
  width: number;
  justification: string;
  type: string;
  /** Permission required to see the data; null = open. */
  maskPermission: string | null;
  /** Set by applyMasking for the requesting viewer. */
  masked: boolean;
}

export interface RunGroup {
  key: CellValue;
  rows: number;
  totals: Record<string, number>;
}

export interface RunResult {
  title: string | null;
  subTitle: string | null;
  footer: string | null;
  runTimeInformation: string | null;
  columns: RunColumn[];
  rows: Record<string, CellValue>[];
  groups: RunGroup[];
  grandTotals: Record<string, number>;
  summaryOnly: boolean;
  truncated: boolean;
  warnings: string[];
  provenance: Record<string, unknown>;
}

interface DefinitionRow {
  name: string;
  title: string | null;
  subTitle: string | null;
  footer: string | null;
  runTimeInformation: string | null;
  definitionJson: unknown;
}

type UserDictRow = UserDictionaryShape & {
  columnHeading?: string | null;
  justification?: string | null;
  formula?: string | null;
  joinSourceId?: string | null;
  joinFieldName?: string | null;
};

/**
 * The ONE report execution path (pack 04) — the interactive endpoint,
 * the archive destination, and the EOD scheduler all call this.
 * Returns UNMASKED rows with per-column mask requirements; callers
 * apply `applyMasking` for the viewing user (pack 07: masking is a
 * render rule, re-evaluated at every view).
 */
export async function executeReportRun(
  db: PostgresJsDatabase,
  opts: {
    row: DefinitionRow;
    source: ReportSource;
    userDicts: UserDictRow[];
    answers: Record<string, unknown>;
    summaryOnly?: boolean;
    runBy: string;
    now?: Date;
  },
): Promise<RunResult> {
  const { row, source, userDicts, answers, runBy } = opts;
  const now = opts.now ?? new Date();
  const doc = row.definitionJson as ReportDefinitionDoc;

  let validated;
  try {
    validated = validateDefinition(row.name, doc, source, userDicts, {
      title: row.title,
      subTitle: row.subTitle,
      footer: row.footer,
    });
  } catch (err) {
    if (err instanceof DefinitionValidationError) {
      throw new BadRequestException(`Definition no longer valid: ${err.message}`);
    }
    throw err;
  }
  const summaryOnly = opts.summaryOnly === true && validated.summaryOnlyAvailable;

  // Resolve every dictionary the run needs into a select expression.
  const userByName = new Map(userDicts.map((d) => [d.name, d]));
  const formulaDicts = new Map<string, string>();
  const selectMap: Record<string, SQL> = {};
  const need = new Set<string>();
  for (const c of doc.columns) need.add(c.dictionary);
  for (const f of doc.filters ?? []) need.add(f.dictionary);
  for (const s of doc.sorts ?? []) need.add(s.dictionary);
  for (const p of doc.prompts ?? []) need.add(p.dictionary);
  for (const name of [...need]) {
    const ud = userByName.get(name);
    if (ud?.kind === 'formula' && ud.formula) {
      for (const ref of parseFormula(ud.formula).refs) need.add(ref);
    }
  }
  for (const name of need) {
    const sys = getSystemDictionary(source, name);
    if (sys) {
      selectMap[name] = sql`${sys.expr}`;
      continue;
    }
    const ud = userByName.get(name);
    if (!ud) throw new BadRequestException(`Dictionary '${name}' no longer exists`);
    if (ud.kind === 'joined') {
      const resolved = joinedExpr(source, ud.joinSourceId!, ud.joinFieldName!);
      if (!resolved) {
        throw new BadRequestException(`Joined dictionary '${name}' no longer resolves`);
      }
      selectMap[name] = resolved.expr;
    } else {
      formulaDicts.set(name, ud.formula!);
    }
  }

  // WHERE: static filters (AND-only, pack 12 rec #1) + prompts (AND).
  const conds: (SQL | undefined)[] = [];
  for (const f of doc.filters ?? []) {
    conds.push(filterCond(source, userByName, f));
  }
  const promptEcho: Record<string, unknown> = {};
  for (const p of doc.prompts ?? []) {
    const raw = answers[p.dictionary];
    if (raw == null || raw === '' || (Array.isArray(raw) && raw.length === 0)) {
      if (p.required) {
        throw new BadRequestException(`Prompt '${p.label}' is required`);
      }
      continue;
    }
    const expr = dictExpr(source, userByName, p.dictionary);
    const resolved = p.dateCode ? resolveDateCode(raw, now) : null;
    promptEcho[p.dictionary] = resolved ? `${raw} → ${resolved.echo}` : raw;
    if (resolved) {
      conds.push(sql`${expr} >= ${resolved.start}::date AND ${expr} <= ${resolved.end}::date`);
    } else if (p.promptType === 'range') {
      const [from, to] = Array.isArray(raw) ? raw : [raw, raw];
      if (from != null && from !== '') conds.push(sql`${expr} >= ${from}`);
      if (to != null && to !== '') conds.push(sql`${expr} <= ${to}`);
    } else if (p.promptType === 'multi_select') {
      const values = Array.isArray(raw) ? raw : [raw];
      const list = sql.join(
        values.map((v) => sql`${v}`),
        sql`, `,
      );
      conds.push(
        p.includeExclude === 'exclude'
          ? sql`(${expr} IS NULL OR ${expr} NOT IN (${list}))`
          : sql`${expr} IN (${list})`,
      );
    } else {
      conds.push(sql`${expr} = ${raw}`);
    }
  }

  // ORDER BY sorts + pk tiebreaker (pack 12 rec #5).
  const orderBy: SQL[] = (doc.sorts ?? []).map(
    (s) => sql`${dictExpr(source, userByName, s.dictionary)} ASC`,
  );
  orderBy.push(sql`${source.tiebreaker} ASC`);

  let q = source.from(db.select(selectMap as never));
  const where = and(...conds.filter((c): c is SQL => Boolean(c)));
  if (where) q = q.where(where);
  q = q.orderBy(...orderBy).limit(ROW_CAP + 1);
  const raw: Record<string, CellValue>[] = await q;
  const truncated = raw.length > ROW_CAP;
  const fetched = truncated ? raw.slice(0, ROW_CAP) : raw;

  const rows = fetched.map((r) => {
    const out: Record<string, CellValue> = { ...r };
    for (const [name, formula] of formulaDicts) {
      try {
        out[name] = evaluateFormula(formula, out) as CellValue;
      } catch (err) {
        out[name] = err instanceof FormulaError ? null : null;
      }
    }
    return out;
  });
  const columns: RunColumn[] = doc.columns.map((c) => {
    const sys = getSystemDictionary(source, c.dictionary);
    const ud = userByName.get(c.dictionary);
    return {
      name: c.dictionary,
      heading: sys?.columnHeading ?? ud?.columnHeading ?? c.dictionary,
      width: c.width ?? sys?.width ?? ud?.width ?? 12,
      justification: sys?.justification ?? ud?.justification ?? 'left',
      type: sys?.type ?? 'text',
      maskPermission: sys?.maskPermission ?? ud?.maskPermission ?? null,
      masked: false,
    };
  });

  // Breaks + totals.
  const breakCol = doc.columns.find((c) => c.break)?.dictionary ?? null;
  const totalCols = doc.columns.filter((c) => c.total).map((c) => c.dictionary);
  const grandTotals: Record<string, number> = {};
  const groups: RunGroup[] = [];
  if (totalCols.length > 0) {
    for (const t of totalCols) grandTotals[t] = 0;
    let current: RunGroup | null = null;
    for (const r of rows) {
      if (breakCol) {
        const key = r[breakCol] ?? null;
        if (!current || current.key !== key) {
          current = { key, rows: 0, totals: Object.fromEntries(totalCols.map((t) => [t, 0])) };
          groups.push(current);
        }
        current.rows += 1;
      }
      for (const t of totalCols) {
        const v = r[t];
        const n = typeof v === 'number' ? v : Number(v ?? 0);
        if (!Number.isNaN(n)) {
          grandTotals[t]! += n;
          if (current) current.totals[t]! += n;
        }
      }
    }
  }

  // Pack 04: run-time options are part of the output.
  const provenance = {
    report: row.name,
    generatedAt: now.toISOString(),
    runBy,
    answers: promptEcho,
    summaryOnly,
    truncated,
    rowCap: ROW_CAP,
  };

  return {
    title: renderTokens(row.title, promptEcho),
    subTitle: renderTokens(row.subTitle, promptEcho),
    footer: renderTokens(row.footer, promptEcho),
    runTimeInformation: row.runTimeInformation,
    columns,
    rows: summaryOnly ? [] : rows,
    groups: breakCol ? groups : [],
    grandTotals,
    summaryOnly,
    truncated,
    warnings: validated.warnings,
    provenance,
  };
}

/**
 * Apply field masking for a specific viewer (pack 07: header stays,
 * cells empty, row count unchanged). Mutates and returns the result.
 */
export function applyMasking(result: RunResult, can: (permission: string) => boolean): RunResult {
  for (const col of result.columns) {
    col.masked = Boolean(col.maskPermission && !can(col.maskPermission));
    if (!col.masked) continue;
    for (const r of result.rows) r[col.name] = null;
    delete result.grandTotals[col.name];
    for (const g of result.groups) delete g.totals[col.name];
  }
  return result;
}

function dictExpr(source: ReportSource, userByName: Map<string, UserDictRow>, name: string): SQL {
  const sys = getSystemDictionary(source, name);
  if (sys) return sql`${sys.expr}`;
  const ud = userByName.get(name);
  if (ud?.kind === 'joined') {
    const resolved = joinedExpr(source, ud.joinSourceId!, ud.joinFieldName!);
    if (resolved) return resolved.expr;
  }
  throw new BadRequestException(`'${name}' cannot be used in filters/sorts/prompts`);
}

function filterCond(
  source: ReportSource,
  userByName: Map<string, UserDictRow>,
  f: ReportFilterDef,
): SQL | undefined {
  const expr = dictExpr(source, userByName, f.dictionary);
  const sys = getSystemDictionary(source, f.dictionary);
  // Pack 02 blank idiom: "" means the empty string.
  const isBlankLiteral = f.value === '""';
  switch (f.operator) {
    case 'EQ':
      return isBlankLiteral
        ? sql`(${expr} IS NULL OR ${expr}::text = '')`
        : sql`${expr} = ${coerce(sys, f.value)}`;
    case 'NE':
      return isBlankLiteral
        ? sql`(${expr} IS NOT NULL AND ${expr}::text <> '')`
        : sql`${expr} IS DISTINCT FROM ${coerce(sys, f.value)}`;
    case 'LT':
      return sql`${expr} < ${coerce(sys, f.value)}`;
    case 'GT':
      return sql`${expr} > ${coerce(sys, f.value)}`;
    case 'LE':
      return sql`${expr} <= ${coerce(sys, f.value)}`;
    case 'GE':
      return sql`${expr} >= ${coerce(sys, f.value)}`;
    case 'TR':
      return sql`${expr} = true`;
    case 'FL':
      return sql`${expr} = false`;
    default:
      return undefined;
  }
}

/**
 * Relative date codes (pack 02): stored as the code, resolved at
 * execution — a scheduled report follows the calendar. Periods are
 * calendar months (presumed fiscal calendar; flagged to the owner).
 */
export function resolveDateCode(
  raw: unknown,
  now: Date,
): { start: string; end: string; echo: string } | null {
  const code = String(Array.isArray(raw) ? raw[0] : raw).toUpperCase();
  const day = (d: Date) => d.toISOString().slice(0, 10);
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  switch (code) {
    case 'TDAY':
      return { start: day(today), end: day(today), echo: day(today) };
    case 'YDAY': {
      const y = new Date(today.getTime() - 86_400_000);
      return { start: day(y), end: day(y), echo: day(y) };
    }
    case 'CPTD': {
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      return { start: day(start), end: day(today), echo: `${day(start)}–${day(today)}` };
    }
    case 'LPTD': {
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
      const end = new Date(
        Math.min(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0),
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, now.getUTCDate()),
        ),
      );
      return { start: day(start), end: day(end), echo: `${day(start)}–${day(end)}` };
    }
    default:
      return null;
  }
}

function coerce(sys: SystemDictionary | undefined, value: string | null | undefined): unknown {
  if (value == null) return null;
  if (sys && (sys.type === 'number' || sys.type === 'money')) {
    const n = Number(value);
    if (Number.isNaN(n)) throw new BadRequestException(`'${value}' is not a number`);
    return n;
  }
  return value;
}

function renderTokens(text: string | null, answers: Record<string, unknown>): string | null {
  if (!text) return text;
  // Unresolved tokens render literally so authors notice (pack 02).
  return text.replace(/\{([A-Z0-9_.]+)\}/gi, (whole, name: string) =>
    name in answers ? String(answers[name]) : whole,
  );
}

export function csvCell(v: CellValue): string {
  if (v == null) return '';
  let s = String(v);
  // CSV-injection guard (house convention since PR #48).
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  if (/[",\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(result: RunResult): string {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(result.provenance)) {
    lines.push(`# ${k}=${typeof v === 'object' ? JSON.stringify(v) : String(v)}`);
  }
  lines.push(result.columns.map((c) => csvCell(c.heading)).join(','));
  for (const r of result.rows) {
    lines.push(result.columns.map((c) => csvCell(r[c.name] ?? null)).join(','));
  }
  for (const g of result.groups) {
    lines.push(
      result.columns
        .map((c, i) =>
          i === 0
            ? csvCell(`TOTAL ${String(g.key ?? '')}`)
            : c.name in g.totals
              ? csvCell(g.totals[c.name]!)
              : '',
        )
        .join(','),
    );
  }
  if (Object.keys(result.grandTotals).length > 0) {
    lines.push(
      result.columns
        .map((c, i) =>
          i === 0
            ? 'GRAND TOTAL'
            : c.name in result.grandTotals
              ? csvCell(result.grandTotals[c.name]!)
              : '',
        )
        .join(','),
    );
  }
  return lines.join('\n');
}
