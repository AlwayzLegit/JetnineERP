import { describe, expect, it } from 'vitest';
import { toCsv } from './csv';

describe('toCsv', () => {
  it('renders a simple header + rows', () => {
    expect(toCsv(['a', 'b'], [['1', '2']])).toBe('a,b\r\n1,2');
  });
  it('quotes commas and quotes', () => {
    expect(toCsv(['x'], [['hello, "world"']])).toBe('x\r\n"hello, ""world"""');
  });
  it('handles null and Date', () => {
    const d = new Date('2026-05-07T00:00:00Z');
    expect(toCsv(['date', 'n'], [[d, null]])).toBe('date,n\r\n2026-05-07T00:00:00.000Z,');
  });
  it('writes numbers without quotes', () => {
    expect(toCsv(['n'], [[42]])).toBe('n\r\n42');
  });
});
