/**
 * Minimal RFC-4180-ish CSV writer. Each row gets every column quoted; we
 * escape internal quotes by doubling them. Returns text suitable for
 * `res.type('text/csv').send(...)`.
 */
export function toCsv(headers: string[], rows: (string | number | null | Date)[][]): string {
  const lines: string[] = [headers.map(escape).join(',')];
  for (const row of rows) {
    lines.push(row.map(format).map(escape).join(','));
  }
  return lines.join('\r\n');
}

function format(value: string | number | null | Date): string {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number') return String(value);
  return value;
}

function escape(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
