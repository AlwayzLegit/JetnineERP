// Computes a minimal before/after diff for entity updates. Only the fields
// that actually changed are recorded — keeps audit_logs.changes_json tight
// and easy to scan.
//
// Returns { before, after } where each side has the same set of keys (the
// changed columns) and other fields are omitted. Returns null if nothing
// changed, so callers can skip writing an audit row entirely.

export interface JsonDiff {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}

export function diffJson(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
): JsonDiff | null {
  if (!before && !after) return null;

  const changedKeys = new Set<string>();
  const beforeObj = before ?? {};
  const afterObj = after ?? {};
  for (const key of Object.keys(beforeObj)) {
    if (!sameValue(beforeObj[key], afterObj[key])) changedKeys.add(key);
  }
  for (const key of Object.keys(afterObj)) {
    if (!(key in beforeObj)) changedKeys.add(key);
  }
  if (changedKeys.size === 0) return null;

  const beforeOut: Record<string, unknown> = {};
  const afterOut: Record<string, unknown> = {};
  for (const key of changedKeys) {
    beforeOut[key] = beforeObj[key] ?? null;
    afterOut[key] = afterObj[key] ?? null;
  }
  return { before: beforeOut, after: afterOut };
}

function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (typeof a !== typeof b) return false;
  if (typeof a === 'object') {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }
  return false;
}
