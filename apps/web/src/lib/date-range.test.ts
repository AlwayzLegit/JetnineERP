import { describe, expect, it } from 'vitest';
import {
  formatRange,
  lastPreset,
  presetLabel,
  previousPeriod,
  quarterPreset,
  rangeFromSearch,
  rangeToSearch,
  resolvePreset,
} from './date-range';

const TODAY = '2026-09-02'; // a Wednesday

describe('date-range presets', () => {
  it('resolves the fixed presets against a given today', () => {
    expect(resolvePreset('today', TODAY)).toEqual({ start: '2026-09-02', end: '2026-09-02' });
    expect(resolvePreset('yesterday', TODAY)).toEqual({ start: '2026-09-01', end: '2026-09-01' });
    expect(resolvePreset('last7', TODAY)).toEqual({ start: '2026-08-27', end: '2026-09-02' });
    expect(resolvePreset('last30', TODAY)).toEqual({ start: '2026-08-04', end: '2026-09-02' });
    expect(resolvePreset('wtd', TODAY)).toEqual({ start: '2026-08-31', end: '2026-09-02' });
    expect(resolvePreset('mtd', TODAY)).toEqual({ start: '2026-09-01', end: '2026-09-02' });
    expect(resolvePreset('qtd', TODAY)).toEqual({ start: '2026-07-01', end: '2026-09-02' });
    expect(resolvePreset('ytd', TODAY)).toEqual({ start: '2026-01-01', end: '2026-09-02' });
    expect(resolvePreset('last_week', TODAY)).toEqual({ start: '2026-08-24', end: '2026-08-30' });
    expect(resolvePreset('last_month', TODAY)).toEqual({ start: '2026-08-01', end: '2026-08-31' });
    expect(resolvePreset('last_quarter', TODAY)).toEqual({
      start: '2026-04-01',
      end: '2026-06-30',
    });
    expect(resolvePreset('last_year', TODAY)).toEqual({ start: '2025-01-01', end: '2025-12-31' });
    expect(resolvePreset('last12m', TODAY)).toEqual({ start: '2025-09-03', end: '2026-09-02' });
  });

  it('resolves rolling "last N units" with and without today', () => {
    expect(resolvePreset(lastPreset(7, 'days', true), TODAY)).toEqual({
      start: '2026-08-27',
      end: '2026-09-02',
    });
    expect(resolvePreset(lastPreset(7, 'days', false), TODAY)).toEqual({
      start: '2026-08-26',
      end: '2026-09-01',
    });
    expect(resolvePreset(lastPreset(2, 'weeks', true), TODAY)).toEqual({
      start: '2026-08-20',
      end: '2026-09-02',
    });
    expect(resolvePreset(lastPreset(3, 'months', true), TODAY)).toEqual({
      start: '2026-06-03',
      end: '2026-09-02',
    });
    expect(presetLabel(lastPreset(7, 'days', true))).toBe('Last 7 days');
    expect(presetLabel(lastPreset(1, 'months', false))).toBe('Last 1 month (before today)');
  });

  it('resolves calendar quarters', () => {
    expect(resolvePreset(quarterPreset(3, 2026), TODAY)).toEqual({
      start: '2026-07-01',
      end: '2026-09-30',
    });
    expect(resolvePreset(quarterPreset(1, 2025), TODAY)).toEqual({
      start: '2025-01-01',
      end: '2025-03-31',
    });
    expect(presetLabel(quarterPreset(4, 2025))).toBe('Q4 2025');
  });

  it('round-trips through the URL, page-level and keyed', () => {
    const params = new URLSearchParams();
    rangeToSearch({ preset: 'last30', start: '', end: '' }, params);
    rangeToSearch(
      { preset: 'custom', start: '2026-08-01', end: '2026-08-15' },
      params,
      'deliveries',
    );
    expect(params.get('range')).toBe('last30');
    expect(params.get('deliveries.start')).toBe('2026-08-01');
    expect(rangeFromSearch(params, 'today', TODAY)).toEqual({
      preset: 'last30',
      start: '2026-08-04',
      end: '2026-09-02',
    });
    expect(rangeFromSearch(params, 'today', TODAY, 'deliveries')).toEqual({
      preset: 'custom',
      start: '2026-08-01',
      end: '2026-08-15',
    });
    // Malformed input falls back.
    const bad = new URLSearchParams('range=nope&start=2026-13-99&end=x');
    expect(rangeFromSearch(bad, 'mtd', TODAY).preset).toBe('mtd');
    // Switching back to a preset clears the custom dates.
    rangeToSearch({ preset: 'today', start: TODAY, end: TODAY }, params, 'deliveries');
    expect(params.get('deliveries.start')).toBeNull();
    expect(params.get('deliveries.range')).toBe('today');
  });

  it('formats and computes the previous period', () => {
    expect(formatRange({ start: '2026-08-26', end: '2026-09-02' })).toBe('Aug 26 – Sep 2, 2026');
    expect(formatRange({ start: '2026-09-02', end: '2026-09-02' })).toBe('Sep 2, 2026');
    expect(formatRange({ start: '2025-12-04', end: '2026-01-02' })).toBe(
      'Dec 4, 2025 – Jan 2, 2026',
    );
    expect(previousPeriod({ preset: 'custom', start: '2026-08-27', end: '2026-09-02' })).toEqual({
      start: '2026-08-20',
      end: '2026-08-26',
    });
  });
});
