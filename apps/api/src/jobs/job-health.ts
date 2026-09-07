export interface JobHealth {
  status: string;
  summary: string;
  actionHref?: string;
  actionLabel?: string;
  /** Only safe, resumable incomplete jobs may run again for the same date. */
  retryable: boolean;
}

export function parseJobDetail(value: string | null): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(value ?? '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

/** Also interprets older rows that recorded success when work was blocked. */
export function jobHealth(
  jobId: string,
  storedStatus: string,
  detail: Record<string, unknown>,
  error: string | null = null,
): JobHealth {
  if (storedStatus === 'failed' || storedStatus === 'skipped') {
    return {
      status: storedStatus,
      summary: error ?? 'The step did not finish. Review the details before retrying.',
      retryable: true,
    };
  }
  if (detail.disabled === true)
    return {
      status: 'disabled',
      summary: 'Automatic replenishment is turned off.',
      actionHref: '/settings',
      actionLabel: 'Review operations settings',
      retryable: true,
    };
  if (jobId === 'gl_derivation' && Array.isArray(detail.skipped)) {
    const skipped = detail.skipped.filter(
      (item): item is { family: string; reason: string } =>
        !!item && typeof item === 'object' && typeof item.reason === 'string',
    );
    const unresolved = skipped.filter((item) => item.reason !== 'already derived for this date');
    if (unresolved.length) {
      const posted = Array.isArray(detail.posted) ? detail.posted.length : 0;
      const completed = posted + skipped.length - unresolved.length;
      return {
        status: completed > 0 ? 'partial' : 'blocked',
        summary: `${unresolved.length} journal group${unresolved.length === 1 ? '' : 's'} need attention. ${unresolved.map((item) => item.reason).join('; ')}. After resolving, run this business date again.`,
        actionHref: '/gl',
        actionLabel: 'Review accounting setup',
        retryable: true,
      };
    }
  }
  if (typeof detail.skipped === 'string')
    return {
      status: 'blocked',
      summary: `The step could not run: ${detail.skipped}.`,
      retryable: true,
      actionHref: '/settings',
      actionLabel: 'Review settings',
    };
  if (jobId === 'report_builder_schedule' && detail.errors && typeof detail.errors === 'object') {
    const count = Object.keys(detail.errors).length;
    if (count > 0)
      return {
        status: Number(detail.archived ?? 0) > 0 ? 'partial' : 'blocked',
        summary: `${count} scheduled report${count === 1 ? '' : 's'} failed. Review the details and run those reports individually; this batch will not repeat archived reports.`,
        actionHref: '/reports/builder',
        actionLabel: 'Review reports',
        retryable: false,
      };
  }
  if (jobId === 'auto_replenishment' && Number(detail.skippedUnassigned ?? 0) > 0)
    return {
      status: Number(detail.created ?? 0) > 0 ? 'partial' : 'blocked',
      summary: `${detail.skippedUnassigned} item(s) need a preferred vendor before a purchase order can be drafted.`,
      actionHref: '/replenishment',
      actionLabel: 'Review replenishment',
      retryable: true,
    };
  return {
    status: storedStatus,
    summary:
      storedStatus === 'succeeded'
        ? 'Completed. No unresolved issues reported.'
        : 'Review the run details.',
    retryable: storedStatus !== 'succeeded',
  };
}
