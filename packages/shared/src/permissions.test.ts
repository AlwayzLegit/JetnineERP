import { describe, expect, it } from 'vitest';
import {
  ALL_PERMISSIONS,
  BUSINESS_PERMISSIONS,
  PERMISSION_GROUPS,
  SUPER_ADMIN_ONLY_PERMISSIONS,
} from './permissions.js';

describe('permission groups', () => {
  it('cover every business permission exactly once', () => {
    const seen = new Map<string, number>();
    for (const g of PERMISSION_GROUPS) {
      for (const p of g.permissions) seen.set(p, (seen.get(p) ?? 0) + 1);
    }
    const duplicates = [...seen.entries()].filter(([, n]) => n > 1);
    expect(duplicates).toEqual([]);
    const missing = BUSINESS_PERMISSIONS.filter((p) => !seen.has(p));
    expect(missing).toEqual([]);
    expect(seen.size).toBe(BUSINESS_PERMISSIONS.length);
  });

  it('never expose a super-admin permission to business grants', () => {
    for (const p of SUPER_ADMIN_ONLY_PERMISSIONS) {
      expect(BUSINESS_PERMISSIONS).not.toContain(p);
      for (const g of PERMISSION_GROUPS) expect(g.permissions).not.toContain(p);
    }
    expect(BUSINESS_PERMISSIONS.length).toBe(
      ALL_PERMISSIONS.length - SUPER_ADMIN_ONLY_PERMISSIONS.length,
    );
  });

  it('groups are non-empty and have unique keys', () => {
    const keys = PERMISSION_GROUPS.map((g) => g.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const g of PERMISSION_GROUPS) expect(g.permissions.length).toBeGreaterThan(0);
  });
});
