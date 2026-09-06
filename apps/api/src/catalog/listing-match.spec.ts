import { describe, expect, it } from 'vitest';
import { hasLowercase, parseListing, rankCandidates, scoreListing } from './listing-match';

const shopify = (name: string) => parseListing({ name });
const storis = (name: string, sku: string, group?: string, brand?: string) =>
  parseListing({ name, sku, attributes: group ? { group } : null, brand });

describe('listing-match', () => {
  it('reads size and firmness off Shopify names and STORIS group codes', () => {
    expect(shopify('California King Helix Twilight 11.5" Firm Hybrid Mattress')).toMatchObject({
      size: 'Cal King',
      firmness: 'Firm',
    });
    expect(shopify('Twin XL Helix Dusk 12" Medium Firm Hybrid Mattress')).toMatchObject({
      size: 'Twin XL',
      firmness: 'Medium Firm',
    });
    expect(storis('CAKING TWILIGHT-ELITE FIRM', 'HEXELITETW-FP-7284', 'CAKING')).toMatchObject({
      size: 'Cal King',
      firmness: 'Firm',
    });
    // No group attribute: the leading STORIS code still classifies.
    expect(storis('TXL DUSK-ELITE MED FIRM', 'HEXELITEDU-TXL')).toMatchObject({
      size: 'Twin XL',
      firmness: 'Medium Firm',
    });
    expect(shopify('Adjustable Base').size).toBeNull();
  });

  it('keeps the model words and drops size / firmness / filler', () => {
    const p = shopify('California King Helix Twilight 11.5" Firm Hybrid Mattress');
    expect([...p.tokens].sort()).toEqual(['HELIX', 'TWILIGHT']);
    const s = storis('CAKING TWILIGHT-ELITE FIRM', 'HEXELITETW-FP-7284', 'CAKING');
    expect(s.tokens.has('TWILIGHT')).toBe(true);
    expect(s.tokens.has('ELITE')).toBe(true);
    expect(s.tokens.has('HEXELITETW')).toBe(true);
    expect(s.tokens.has('CAKING')).toBe(false);
  });

  it('scores the right STORIS listing above the wrong ones', () => {
    const from = shopify('California King Helix Twilight 11.5" Firm Hybrid Mattress');
    const right = storis('CAKING TWILIGHT-ELITE FIRM', 'HEXELITETW-FP-7284', 'CAKING');
    const wrongModel = storis('CAKING DUSK-ELITE FIRM', 'HEXELITEDU-FP-7284', 'CAKING');
    const wrongSize = storis('QUEEN TWILIGHT-ELITE FIRM', 'HEXELITETW-FP-5060', 'QUEEN');
    const wrongFirmness = storis('CAKING TWILIGHT-ELITE PLUSH', 'HEXELITETWP-FP-7284', 'CAKING');

    const r = scoreListing(from, right);
    expect(r.score).toBeGreaterThanOrEqual(0.7);
    expect(r.matchedTokens).toContain('TWILIGHT');
    expect(scoreListing(from, wrongSize).score).toBe(0);
    expect(scoreListing(from, wrongModel).score).toBeLessThan(0.3);
    expect(scoreListing(from, wrongFirmness).score).toBeLessThan(r.score);
  });

  it('treats a case-insensitive SKU match as certain', () => {
    const from = shopify('Queen Purple Restore Plus');
    const to = storis('QUEEN RESTORE PLUS', 'purple-restore-plus-q');
    expect(
      scoreListing(from, to, {
        fromSku: 'PURPLE-RESTORE-PLUS-Q',
        toSku: to && 'purple-restore-plus-q',
      }).score,
    ).toBe(1);
  });

  it('ranks candidates and drops the hopeless ones', () => {
    const from = shopify('Queen Helix Midnight 12" Medium Hybrid Mattress');
    const pool = [
      { item: 'right', sku: 'HEXMID-Q', parsed: storis('QUEEN MIDNIGHT MED', 'HEXMID-Q', 'QUEEN') },
      {
        item: 'luxe',
        sku: 'HEXMIDL-Q',
        parsed: storis('QUEEN MIDNIGHT-LUXE MED', 'HEXMIDL-Q', 'QUEEN'),
      },
      { item: 'king', sku: 'HEXMID-K', parsed: storis('KING MIDNIGHT MED', 'HEXMID-K', 'KING') },
      { item: 'base', sku: 'BASE-Q', parsed: storis('QUEEN ADJUSTABLE BASE', 'BASE-Q', 'QUEEN') },
    ];
    const ranked = rankCandidates(from, null, pool);
    expect(ranked.map((r) => r.item)).toEqual(['right', 'luxe']);
    expect(ranked[0]!.detail.score).toBeGreaterThan(ranked[1]!.detail.score);
  });

  it("applies the owner's lowercase rule", () => {
    expect(hasLowercase('California King Helix Twilight')).toBe(true);
    expect(hasLowercase('CAKING TWILIGHT-ELITE FIRM')).toBe(false);
    expect(hasLowercase('Q-MOS10')).toBe(false);
  });
});
