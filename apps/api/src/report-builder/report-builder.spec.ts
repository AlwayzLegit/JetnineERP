/**
 * Report-builder acceptance tests, pure subset — ported from
 * docs/handoffs/storis-report-builder/11-acceptance-tests.md before the
 * implementation, per the pack's own instruction. Numbers reference
 * that file. The stack-touching scenarios live in
 * test/report-builder.int.spec.ts.
 */
import { describe, expect, it } from 'vitest';
import { evaluateFormula, parseFormula, FormulaError } from './formula';
import {
  assertNotReserved,
  DefinitionValidationError,
  validateDefinition,
  type ReportDefinitionDoc,
} from './definition';
import { getSource } from './report-sources';

const orders = getSource('orders')!;

function doc(over: Partial<ReportDefinitionDoc> = {}): ReportDefinitionDoc {
  return {
    columns: [{ dictionary: 'ORDER_NUMBER' }, { dictionary: 'TOTAL' }],
    prompts: [],
    filters: [],
    sorts: [],
    ...over,
  };
}

describe('formula language (acceptance 4–6)', () => {
  it('#4 unknown dictionary names error, never null', () => {
    expect(() => evaluateFormula('{NOPE} + 1', { TOTAL: 5 })).toThrow(FormulaError);
  });

  it('#5 constructs outside the closed set are rejected at parse time', () => {
    expect(() => parseFormula('DROP(1)')).toThrow(FormulaError);
    expect(() => parseFormula('require("fs")')).toThrow(FormulaError);
    expect(() => parseFormula('{A}; {B}')).toThrow(FormulaError);
  });

  it('arithmetic, comparison, and the function set evaluate', () => {
    const row = { TOTAL: 2500, TAX: 250, NAME: 'ab' };
    expect(evaluateFormula('{TOTAL} - {TAX}', row)).toBe(2250);
    expect(evaluateFormula('ROUND({TOTAL} / 3, 2)', row)).toBe(833.33);
    expect(evaluateFormula("IF({TOTAL} > 1000, 'big', 'small')", row)).toBe('big');
    expect(evaluateFormula("CONCAT(UPPER({NAME}), '-', 1)", row)).toBe('AB-1');
    expect(evaluateFormula('{TOTAL} / 0', row)).toBeNull();
  });

  it('parseFormula reports referenced names for save-time validation', () => {
    expect(parseFormula('{A} + {B} * {A}').refs.sort()).toEqual(['A', 'B']);
  });
});

describe('definition validation (acceptance 10–20)', () => {
  it('#10 no source ⇒ handled upstream; no columns is rejected here', () => {
    expect(() => validateDefinition('R', doc({ columns: [] }), orders, [])).toThrow(
      DefinitionValidationError,
    );
  });

  it('#12 a period-bearing prompt dictionary is rejected', () => {
    expect(() =>
      validateDefinition(
        'R',
        doc({
          prompts: [{ dictionary: 'OPER.INIT', label: 'Init', promptType: 'simple' }],
        }),
        orders,
        [],
      ),
    ).toThrow(/period/);
  });

  it('#13 New Page requires Break on the same row', () => {
    expect(() =>
      validateDefinition(
        'R',
        doc({ columns: [{ dictionary: 'ORDER_NUMBER', newPage: true }] }),
        orders,
        [],
      ),
    ).toThrow(/New Page/);
  });

  it('#14 Break without the matching sort is rejected', () => {
    expect(() =>
      validateDefinition(
        'R',
        doc({ columns: [{ dictionary: 'STATUS', break: true }, { dictionary: 'TOTAL' }] }),
        orders,
        [],
      ),
    ).toThrow(/Sorting/);
  });

  it('#15 Include/Exclude only with multi-select', () => {
    expect(() =>
      validateDefinition(
        'R',
        doc({
          prompts: [
            {
              dictionary: 'STATUS',
              label: 'Status',
              promptType: 'simple',
              includeExclude: 'exclude',
            },
          ],
        }),
        orders,
        [],
      ),
    ).toThrow(/multi-select/);
  });

  it('#16 a header token with no matching prompt is rejected', () => {
    expect(() =>
      validateDefinition('R', doc(), orders, [], { subTitle: 'Orders for {ORD_DATE}' }),
    ).toThrow(/token/);
    // And a matching one passes.
    expect(
      validateDefinition(
        'R',
        doc({
          prompts: [
            { dictionary: 'WRITTEN_DATE', label: 'Date', promptType: 'range', dateCode: true },
          ],
        }),
        orders,
        [],
        { subTitle: 'Orders for {WRITTEN_DATE}' },
      ).warnings,
    ).toEqual([]);
  });

  it('#17 the reserved system prefix is rejected at creation', () => {
    expect(() => assertNotReserved('S$SALES')).toThrow(/reserved/);
    expect(() => assertNotReserved('SALES')).not.toThrow();
  });

  it('#18 width over 132 warns, not errors', () => {
    const wide = validateDefinition(
      'R',
      doc({
        columns: Array.from({ length: 12 }, () => ({ dictionary: 'CUSTOMER', width: 22 })),
      }),
      orders,
      [],
    );
    expect(wide.warnings.some((w) => w.includes('132'))).toBe(true);
  });

  it('#19 unknown operators are rejected', () => {
    expect(() =>
      validateDefinition(
        'R',
        doc({
          filters: [{ dictionary: 'STATUS', operator: 'LIKE' as never, value: 'x' }],
        }),
        orders,
        [],
      ),
    ).toThrow(/operator/i);
  });

  it('#20 TR/FL with a value is rejected', () => {
    expect(() =>
      validateDefinition(
        'R',
        doc({ filters: [{ dictionary: 'STATUS', operator: 'TR', value: 'yes' }] }),
        orders,
        [],
      ),
    ).toThrow(/no value/);
  });

  it('#21 Summary Only derives from break + total on different dictionaries', () => {
    const both = validateDefinition(
      'R',
      doc({
        columns: [
          { dictionary: 'STATUS', break: true },
          { dictionary: 'TOTAL', total: true },
        ],
        sorts: [{ dictionary: 'STATUS' }],
      }),
      orders,
      [],
    );
    expect(both.summaryOnlyAvailable).toBe(true);
    const same = validateDefinition(
      'R',
      doc({
        columns: [{ dictionary: 'TOTAL', break: true, total: true }],
        sorts: [{ dictionary: 'TOTAL' }],
      }),
      orders,
      [],
    );
    expect(same.summaryOnlyAvailable).toBe(false);
  });

  it('key fields excluded from the builder cannot be selected', () => {
    expect(() =>
      validateDefinition('R', doc({ columns: [{ dictionary: 'ORDER_ID' }] }), orders, []),
    ).toThrow(/key field/);
  });

  it('a total on a non-numeric dictionary is rejected', () => {
    expect(() =>
      validateDefinition(
        'R',
        doc({ columns: [{ dictionary: 'STATUS', total: true }] }),
        orders,
        [],
      ),
    ).toThrow(/not numeric/);
  });
});
