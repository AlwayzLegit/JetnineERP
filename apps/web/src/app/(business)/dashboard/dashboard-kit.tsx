'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Card, EmptyState, LoadingRows, StatTile, TableWrap } from '@/components/ui';

/**
 * Small helpers shared by the role dashboards (owner, manager, operations,
 * warehouse, cashier) on top of the layout-contract primitives in
 * `components/ui`. Nothing here defines its own spacing or typography.
 */

/**
 * A card whose body is a single table. Flush (the card is the table's
 * frame) while it has rows; a padded `EmptyState` or `LoadingRows`
 * otherwise. `children` is the `<table className="table …">` itself so
 * a `data-testid` can stay on the table.
 */
export function TableCard({
  title,
  description,
  actions,
  isEmpty,
  empty,
  loading,
  maxHeight,
  children,
  ...rest
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  isEmpty: boolean;
  empty: ReactNode;
  /** Still fetching — show shimmer rows instead of the empty copy. */
  loading?: boolean;
  /** Internal scroll for long lists; pair with `table-sticky` on the table. */
  maxHeight?: number | string;
  children?: ReactNode;
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>) {
  const flush = !loading && !isEmpty;
  return (
    <Card title={title} description={description} actions={actions} flush={flush} {...rest}>
      {loading ? (
        <LoadingRows rows={3} />
      ) : isEmpty ? (
        <EmptyState>{empty}</EmptyState>
      ) : (
        <TableWrap maxHeight={maxHeight}>{children}</TableWrap>
      )}
    </Card>
  );
}

/** A KPI tile that is also a link to the screen behind the number. */
export function StatLink({
  href,
  testid,
  label,
  value,
  sub,
  tone,
}: {
  href: string;
  testid?: string;
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'success' | 'warning' | 'danger' | 'brand';
}) {
  return (
    <Link href={href} className="block h-full text-inherit no-underline" data-testid={testid}>
      <StatTile className="card-hover" label={label} value={value} sub={sub} tone={tone} />
    </Link>
  );
}

/** "$1.2k" / "$412.00" — compact money for tile sub-lines and bar labels. */
export function usdShort(cents: number): string {
  return cents >= 100_000
    ? `$${(cents / 100_000).toFixed(1)}k`
    : `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

/** Plain "$412.00" for inline text where a `<Money>` element is awkward. */
export function usd(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
