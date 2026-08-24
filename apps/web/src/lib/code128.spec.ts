import { describe, expect, it } from 'vitest';
import { canEncodeCode128, code128Svg } from './code128';

// Known-good checksum: for "SKU-1", symbols are S=51 K=43 U=53 -=13 1=17;
// checksum = (104 + 51*1 + 43*2 + 53*3 + 13*4 + 17*5) % 103
//          = (104 + 51 + 86 + 159 + 52 + 85) % 103 = 537 % 103 = 22.
describe('code128Svg', () => {
  it('encodes plain ASCII and embeds the text as the aria-label', () => {
    const svg = code128Svg('SKU-1');
    expect(svg).toBeTruthy();
    expect(svg).toContain('aria-label="SKU-1"');
    expect(svg).toContain('<rect');
  });

  it('produces the documented element count: (start + n + check + stop)', () => {
    // 5 data symbols + start + checksum = 7 six-element symbols → 21 bars,
    // stop adds 4 bars (7 elements, indices 0,2,4,6) → 25 rects total.
    const svg = code128Svg('SKU-1')!;
    const bars = svg.match(/<rect/g)!.length;
    expect(bars).toBe(7 * 3 + 4);
  });

  it('is deterministic', () => {
    expect(code128Svg('INV-2026-000123')).toBe(code128Svg('INV-2026-000123'));
  });

  it('rejects text outside ASCII 32–126 and empty text', () => {
    expect(code128Svg('café')).toBeNull();
    expect(code128Svg('')).toBeNull();
    expect(canEncodeCode128('ok text')).toBe(true);
    expect(canEncodeCode128('tab\there')).toBe(false);
  });

  it('escapes XML-hostile characters in the label', () => {
    const svg = code128Svg('A<B>&"C');
    expect(svg).toBeTruthy();
    expect(svg).toContain('aria-label="A&lt;B&gt;&amp;&quot;C"');
    expect(svg).not.toContain('aria-label="A<');
  });
});
