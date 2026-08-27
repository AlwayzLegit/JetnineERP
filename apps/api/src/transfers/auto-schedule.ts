/**
 * XFR-053 — the auto-transfer schedule date, exactly as STORIS states it:
 *
 *   transfer_date = Auto Schedule Days + today + 1
 *
 * then rolled forward to the destination location's next allowed weekday
 * (`Automatic Replenishment Days`, CFG-LOC-REPLDAYS). Weekdays are
 * 0=Sunday … 6=Saturday. `allowedDays` null/undefined = every day;
 * an explicit empty set has no valid day, so the caller must not loop —
 * we return null and the caller skips generation with a visible warning.
 */
export function computeAutoTransferDate(
  createdAt: Date,
  autoScheduleDays: number,
  allowedDays: readonly number[] | null | undefined,
): Date | null {
  const candidate = new Date(createdAt.getTime());
  candidate.setHours(12, 0, 0, 0); // noon guards against DST midnight skips
  candidate.setDate(candidate.getDate() + autoScheduleDays + 1);
  if (allowedDays == null) return candidate;
  const allowed = new Set(allowedDays);
  if (allowed.size === 0) return null;
  for (let i = 0; i < 7; i++) {
    if (allowed.has(candidate.getDay())) return candidate;
    candidate.setDate(candidate.getDate() + 1);
  }
  return null;
}
