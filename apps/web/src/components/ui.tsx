'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Shared UI primitives over the design tokens in globals.css.
 * Pages adopt these instead of bespoke inline styles; anything not
 * covered can still pass `style`/`className` through.
 */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  variant = 'secondary',
  size,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: 'sm';
}) {
  return (
    <button
      type="button"
      {...props}
      className={cx('btn', `btn-${variant}`, size === 'sm' && 'btn-sm', className)}
    />
  );
}

export function LinkButton({
  href,
  variant = 'secondary',
  size,
  className,
  children,
  ...props
}: {
  href: string;
  variant?: Variant;
  size?: 'sm';
  className?: string;
  children: ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  return (
    <Link
      href={href}
      {...props}
      className={cx('btn', `btn-${variant}`, size === 'sm' && 'btn-sm', className)}
    >
      {children}
    </Link>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx('input', props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx('select', props.className)} />;
}

export function Field({
  label,
  children,
  className,
  style,
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <label className={className} style={{ display: 'block', ...style }}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

export function Card({
  title,
  children,
  actions,
  className,
  style,
  ...rest
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>) {
  return (
    <div {...rest} className={cx('card', className)} style={style}>
      {(title || actions) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: title ? 12 : 0,
          }}
        >
          {title && (
            <h3 className="card-title" style={{ margin: 0, flex: 1 }}>
              {title}
            </h3>
          )}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  sub,
  actions,
}: {
  title: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">{title}</h1>
        {actions && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {actions}
          </div>
        )}
      </div>
      {sub && <p className="page-sub">{sub}</p>}
    </>
  );
}

const STATUS_TONES: Record<string, string> = {
  // documents
  quote: 'warning',
  draft: 'neutral',
  open: 'info',
  confirmed: 'info',
  ordered: 'info',
  partially_fulfilled: 'brand',
  partially_received: 'brand',
  partially_refunded: 'warning',
  fulfilled: 'success',
  received: 'success',
  completed: 'success',
  delivered: 'success',
  paid: 'success',
  active: 'success',
  succeeded: 'success',
  valid: 'success',
  committed: 'success',
  scheduled: 'info',
  out_for_delivery: 'brand',
  in_service: 'info',
  awaiting_parts: 'warning',
  intake: 'warning',
  ready: 'success',
  pending: 'neutral',
  due: 'neutral',
  invalid: 'danger',
  overdue: 'danger',
  failed: 'danger',
  cancelled: 'danger',
  canceled: 'danger',
  refunded: 'danger',
  disabled: 'danger',
  suspended: 'danger',
};

/** Colored pill for any document/lifecycle status string. */
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = STATUS_TONES[status] ?? 'neutral';
  return (
    <span className={cx('badge', `badge-${tone}`, className)}>{status.replace(/_/g, ' ')}</span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty-state">{children}</div>;
}

export function Skeleton({ style }: { style?: React.CSSProperties }) {
  return <div className="skeleton" style={style} />;
}

/** Three shimmering rows — the standard "table is loading" placeholder. */
export function LoadingRows({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} style={{ height: 32 }} />
      ))}
    </div>
  );
}

function cx(...parts: (string | false | undefined | null)[]): string {
  return parts.filter(Boolean).join(' ');
}
