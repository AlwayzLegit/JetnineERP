import { describe, expect, it } from 'vitest';
import { jobHealth, parseJobDetail } from './job-health';

describe('nightly job health', () => {
  const missing = { family: 'order_money_in', reason: 'unmapped system key(s): cash_bank' };
  const already = { family: 'pos_sales', reason: 'already derived for this date' };

  it('corrects historical GL successes with missing mappings and allows a retry', () => {
    const result = jobHealth('gl_derivation', 'succeeded', { posted: [], skipped: [missing] });
    expect(result.status).toBe('blocked');
    expect(result.retryable).toBe(true);
    expect(result.actionHref).toBe('/gl');
    expect(result.summary).toContain('cash_bank');
  });
  it('reports partial completion when some groups are already posted', () => {
    expect(
      jobHealth('gl_derivation', 'succeeded', { posted: [{}], skipped: [missing] }).status,
    ).toBe('partial');
    expect(
      jobHealth('gl_derivation', 'succeeded', { posted: [], skipped: [already, missing] }).status,
    ).toBe('partial');
  });
  it('treats already-derived groups as completed, not blocked', () => {
    expect(
      jobHealth('gl_derivation', 'succeeded', { posted: [], skipped: [already] }),
    ).toMatchObject({ status: 'succeeded', retryable: false });
  });
  it('shows closed-period work as blocked', () => {
    expect(
      jobHealth('gl_derivation', 'succeeded', {
        skipped: [{ family: '*', reason: 'period 2026-9 is closed' }],
      }).status,
    ).toBe('blocked');
  });
  it('distinguishes disabled automation from successful work', () => {
    expect(jobHealth('auto_replenishment', 'succeeded', { disabled: true })).toMatchObject({
      status: 'disabled',
      retryable: true,
    });
  });
  it('does not repeat successful report archives when some reports failed', () => {
    expect(
      jobHealth('report_builder_schedule', 'succeeded', {
        archived: 1,
        errors: { 'Sales report': 'Unknown source' },
      }),
    ).toMatchObject({ status: 'partial', retryable: false, actionHref: '/reports/builder' });
  });
  it('distinguishes missing setup from an empty successful run', () => {
    expect(
      jobHealth('auto_replenishment', 'succeeded', { skipped: 'no active location' }).status,
    ).toBe('blocked');
    expect(
      jobHealth('auto_replenishment', 'succeeded', { created: 0, skippedUnassigned: 2 }).status,
    ).toBe('blocked');
    expect(jobHealth('report_builder_schedule', 'succeeded', { scheduled: 0 }).status).toBe(
      'succeeded',
    );
  });
  it('keeps execution errors visible even with old detail fields', () => {
    expect(
      jobHealth('auto_replenishment', 'failed', { disabled: true }, 'Connection lost'),
    ).toMatchObject({ status: 'failed', summary: 'Connection lost' });
  });
  it('handles empty and malformed historical detail safely', () => {
    for (const input of [null, '', '{broken', 'null', '[]', '42'])
      expect(parseJobDetail(input)).toEqual({});
    expect(parseJobDetail('{"disabled":true}')).toEqual({ disabled: true });
  });
});
