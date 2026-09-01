import { describe, expect, it } from 'vitest';
import { applyZipHit, looksLikeZip } from './zip-lookup';

describe('looksLikeZip', () => {
  it('accepts US 5-digit, ZIP+4 and Canadian codes', () => {
    expect(looksLikeZip('90036')).toBe(true);
    expect(looksLikeZip(' 90036-1234 ')).toBe(true);
    expect(looksLikeZip('m5v 3l9')).toBe(true);
    expect(looksLikeZip('9003')).toBe(false);
    expect(looksLikeZip('abcde')).toBe(false);
  });
});

describe('applyZipHit', () => {
  const la = { city: 'Los Angeles', state: 'CA' };
  const sf = { city: 'San Francisco', state: 'CA' };

  it('fills empty city and state', () => {
    expect(applyZipHit({ city: '', region: '' }, la, null)).toEqual({
      city: 'Los Angeles',
      region: 'CA',
    });
  });

  it('never overwrites what the person typed', () => {
    expect(applyZipHit({ city: 'Hancock Park', region: 'CA' }, sf, null)).toEqual({
      city: 'Hancock Park',
      region: 'CA',
    });
  });

  it('replaces a previous autofill when the ZIP changes', () => {
    expect(applyZipHit({ city: 'Los Angeles', region: 'CA' }, sf, la)).toEqual({
      city: 'San Francisco',
      region: 'CA',
    });
  });

  it('keeps a hand edit even after an earlier autofill', () => {
    expect(applyZipHit({ city: 'Hancock Park', region: 'CA' }, sf, la)).toEqual({
      city: 'Hancock Park',
      region: 'CA',
    });
  });
});
