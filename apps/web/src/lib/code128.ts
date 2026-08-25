/**
 * Minimal Code 128 (code set B) encoder producing an inline SVG string.
 * No dependencies — label sheets and receipts must print from any
 * register machine, including offline ones, so we can't lean on a CDN
 * or a native module.
 *
 * Code set B covers ASCII 32–126, which is every SKU and document
 * number this system generates. Characters outside that range are
 * rejected rather than silently mangled — a label with a wrong barcode
 * is worse than no label.
 */

// Standard Code 128 widths table, symbols 0–105 (6 elements each:
// bar,space,bar,space,bar,space) plus the 7-element stop at 106.
const PATTERNS = [
  '212222',
  '222122',
  '222221',
  '121223',
  '121322',
  '131222',
  '122213',
  '122312',
  '132212',
  '221213',
  '221312',
  '231212',
  '112232',
  '122132',
  '122231',
  '113222',
  '123122',
  '123221',
  '223211',
  '221132',
  '221231',
  '213212',
  '223112',
  '312131',
  '311222',
  '321122',
  '321221',
  '312212',
  '322112',
  '322211',
  '212123',
  '212321',
  '232121',
  '111323',
  '131123',
  '131321',
  '112313',
  '132113',
  '132311',
  '211313',
  '231113',
  '231311',
  '112133',
  '112331',
  '132131',
  '113123',
  '113321',
  '133121',
  '313121',
  '211331',
  '231131',
  '213113',
  '213311',
  '213131',
  '311123',
  '311321',
  '331121',
  '312113',
  '312311',
  '332111',
  '314111',
  '221411',
  '431111',
  '111224',
  '111422',
  '121124',
  '121421',
  '141122',
  '141221',
  '112214',
  '112412',
  '122114',
  '122411',
  '142112',
  '142211',
  '241211',
  '221114',
  '413111',
  '241112',
  '134111',
  '111242',
  '121142',
  '121241',
  '114212',
  '124112',
  '124211',
  '411212',
  '421112',
  '421211',
  '212141',
  '214121',
  '412121',
  '111143',
  '111341',
  '131141',
  '114113',
  '114311',
  '411113',
  '411311',
  '113141',
  '114131',
  '311141',
  '411131',
  '211412',
  '211214',
  '211232',
  '2331112',
] as const;

const START_B = 104;
const STOP = 106;

/** Symbol values for the text in code set B, or null if unencodable. */
function symbolsFor(text: string): number[] | null {
  if (text.length === 0) return null;
  const out: number[] = [];
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code < 32 || code > 126) return null;
    out.push(code - 32);
  }
  return out;
}

export function canEncodeCode128(text: string): boolean {
  return symbolsFor(text) != null;
}

/**
 * Render `text` as a Code 128B barcode SVG. Returns null when the text
 * can't be encoded. The SVG scales to its container (viewBox only), so
 * callers set the printed size with CSS.
 */
export function code128Svg(
  text: string,
  opts: { height?: number; moduleWidth?: number; quietZone?: number } = {},
): string | null {
  const symbols = symbolsFor(text);
  if (!symbols) return null;
  const height = opts.height ?? 40;
  const mw = opts.moduleWidth ?? 1;
  const quiet = opts.quietZone ?? 10; // spec minimum is 10 modules

  let checksum = START_B;
  symbols.forEach((s, i) => {
    checksum += s * (i + 1);
  });
  const sequence = [START_B, ...symbols, checksum % 103, STOP];

  let x = quiet * mw;
  const rects: string[] = [];
  for (const sym of sequence) {
    const widths = PATTERNS[sym]!;
    for (let i = 0; i < widths.length; i++) {
      const w = Number(widths[i]) * mw;
      // Even indices are bars, odd are spaces.
      if (i % 2 === 0) {
        rects.push(`<rect x="${x}" y="0" width="${w}" height="${height}"/>`);
      }
      x += w;
    }
  }
  const totalWidth = x + quiet * mw;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${height}" ` +
    `preserveAspectRatio="none" role="img" aria-label="${escapeXml(text)}">` +
    `<g fill="#000">${rects.join('')}</g></svg>`
  );
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
