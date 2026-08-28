import { parseFormula, FormulaError } from './formula';
import type { ReportSource, SystemDictionary } from './report-sources';

/**
 * Report definition document (pack 01/02) and its validation
 * checklist. Pure — the controller persists what this approves.
 */

export const FILTER_OPERATORS = ['EQ', 'NE', 'LT', 'GT', 'LE', 'GE', 'TR', 'FL'] as const;
export type FilterOperator = (typeof FILTER_OPERATORS)[number];

export interface ReportColumnDef {
  dictionary: string;
  width?: number | null;
  break?: boolean;
  newPage?: boolean;
  total?: boolean;
}

export interface ReportPromptDef {
  dictionary: string;
  label: string;
  required?: boolean;
  promptType: 'simple' | 'range' | 'multi_select';
  dateCode?: boolean;
  includeExclude?: 'include' | 'exclude' | null;
}

export interface ReportFilterDef {
  dictionary: string;
  operator: FilterOperator;
  value?: string | null;
}

export interface ReportSortDef {
  dictionary: string;
}

export interface ReportDefinitionDoc {
  columns: ReportColumnDef[];
  prompts: ReportPromptDef[];
  filters: ReportFilterDef[];
  sorts: ReportSortDef[];
}

/** Reserved vendor-standard prefix (pack 01): never user-creatable. */
export const RESERVED_PREFIX = 'S$';
/** PDF line width the pack warns at (pack 02). */
export const WIDTH_WARNING_AT = 132;

export interface UserDictionaryShape {
  name: string;
  kind: 'formula' | 'joined';
  width: number;
  maskPermission?: string | null;
}

export class DefinitionValidationError extends Error {}

/** Pack 01 reserved-name rule — enforced at creation/clone, never on
 * validating an existing (possibly system) definition. */
export function assertNotReserved(name: string): void {
  if (name.toUpperCase().startsWith(RESERVED_PREFIX)) {
    throw new DefinitionValidationError(
      `Report names beginning '${RESERVED_PREFIX}' are reserved for system reports`,
    );
  }
}

export interface ValidatedDefinition {
  warnings: string[];
  /** Derived (pack 01 invariant 3): Summary Only offered at run time. */
  summaryOnlyAvailable: boolean;
  totalReportWidth: number;
}

/**
 * The pack 02 validation checklist, enforced on save AND on run
 * (pack 01 invariant 1 — a dictionary can vanish after authoring).
 */
export function validateDefinition(
  name: string,
  doc: ReportDefinitionDoc,
  source: ReportSource,
  userDicts: UserDictionaryShape[],
  opts: { title?: string | null; subTitle?: string | null; footer?: string | null } = {},
): ValidatedDefinition {
  const warnings: string[] = [];
  void name; // kept for error messages; reserved-prefix is a creation rule
  if (!doc.columns?.length) {
    throw new DefinitionValidationError('A report needs at least one output column');
  }

  const known = new Map<string, { system?: SystemDictionary; user?: UserDictionaryShape }>();
  for (const d of source.dictionaries) known.set(d.name, { system: d });
  for (const d of userDicts) known.set(d.name, { user: d });
  const resolve = (dict: string, where: string) => {
    const hit = known.get(dict);
    if (!hit) {
      throw new DefinitionValidationError(
        `${where} references '${dict}', which is not a dictionary of source '${source.id}'`,
      );
    }
    if (hit.system && hit.system.selectableInBuilder === false) {
      throw new DefinitionValidationError(`'${dict}' is a key field and cannot be selected`);
    }
    return hit;
  };

  const sortSet = new Set(doc.sorts?.map((s) => s.dictionary) ?? []);
  for (const s of doc.sorts ?? []) resolve(s.dictionary, 'Sorting');

  let totalWidth = 0;
  let breakDict: string | null = null;
  let totalOnOther = false;
  for (const c of doc.columns) {
    const hit = resolve(c.dictionary, 'Output');
    totalWidth += c.width ?? hit.system?.width ?? hit.user?.width ?? 12;
    if (c.newPage && !c.break) {
      throw new DefinitionValidationError(
        `'${c.dictionary}': New Page requires Break on the same column`,
      );
    }
    if (c.break) {
      if (!sortSet.has(c.dictionary)) {
        throw new DefinitionValidationError(
          `'${c.dictionary}' breaks but is not on the Sorting tab — add the sort`,
        );
      }
      breakDict = c.dictionary;
    }
  }
  for (const c of doc.columns) {
    if (c.total && breakDict && c.dictionary !== breakDict) totalOnOther = true;
    if (c.total) {
      const hit = known.get(c.dictionary);
      const t = hit?.system?.type;
      if (hit?.system && t !== 'number' && t !== 'money') {
        throw new DefinitionValidationError(`'${c.dictionary}' is not numeric — Total unavailable`);
      }
    }
  }
  if (totalWidth > WIDTH_WARNING_AT) {
    warnings.push(
      `Total report width ${totalWidth} exceeds ${WIDTH_WARNING_AT} — PDF output will wrap`,
    );
  }

  const promptNames = new Set<string>();
  for (const p of doc.prompts ?? []) {
    if (p.dictionary.includes('.')) {
      // Pack 02: period-bearing prompt dictionaries are a hard error.
      throw new DefinitionValidationError(
        `'${p.dictionary}' contains a period and cannot drive a prompt`,
      );
    }
    resolve(p.dictionary, 'Prompts');
    if (p.includeExclude && p.promptType !== 'multi_select') {
      throw new DefinitionValidationError('Include/Exclude applies only to multi-select prompts');
    }
    promptNames.add(p.dictionary);
  }

  for (const f of doc.filters ?? []) {
    resolve(f.dictionary, 'Selection');
    if (!FILTER_OPERATORS.includes(f.operator)) {
      throw new DefinitionValidationError(`Unknown operator '${String(f.operator)}'`);
    }
    if ((f.operator === 'TR' || f.operator === 'FL') && f.value != null && f.value !== '') {
      throw new DefinitionValidationError(`Operator ${f.operator} takes no value`);
    }
  }

  // Header tokens must match prompt dictionaries (pack 02).
  for (const [label, text] of [
    ['Title', opts.title],
    ['Sub Title', opts.subTitle],
    ['Footer', opts.footer],
  ] as const) {
    for (const m of (text ?? '').matchAll(/\{([A-Z0-9_.]+)\}/gi)) {
      if (!promptNames.has(m[1]!)) {
        throw new DefinitionValidationError(
          `${label} token {${m[1]}} does not match any prompt dictionary`,
        );
      }
    }
  }

  return {
    warnings,
    summaryOnlyAvailable: Boolean(breakDict) && totalOnOther,
    totalReportWidth: totalWidth,
  };
}

/** Validate a user formula dictionary at save time (pack 03). */
export function validateFormulaDictionary(
  formula: string,
  source: ReportSource,
  existingUserDicts: UserDictionaryShape[],
  selfName: string,
): void {
  let refs: string[];
  try {
    refs = parseFormula(formula).refs;
  } catch (err) {
    if (err instanceof FormulaError) throw new DefinitionValidationError(err.message);
    throw err;
  }
  const known = new Set<string>([
    ...source.dictionaries.map((d) => d.name),
    ...existingUserDicts.map((d) => d.name),
  ]);
  known.delete(selfName); // no self-reference
  for (const r of refs) {
    if (!known.has(r)) {
      throw new DefinitionValidationError(
        `Formula references '${r}', which is not a dictionary of source '${source.id}'`,
      );
    }
  }
}
