import Link from 'next/link';
import type { ReactNode } from 'react';
import { CheckCircle2, MailCheck, ShieldCheck, XCircle } from 'lucide-react';

/**
 * The signed-out frame (owner 2026-09-02): brand mark over a soft
 * gradient, one card, a quiet footer. Every auth and onboarding screen
 * sits inside it so the whole path from invite to first sale feels like
 * one product.
 */
export function AuthShell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <main className="auth-bg">
      <div className="auth-column" style={wide ? { maxWidth: 560 } : undefined}>
        <div className="auth-brand">
          <span className="auth-brand-mark" aria-hidden>
            LA
          </span>
          <span className="auth-brand-name">LA Mattress ERP</span>
        </div>
        <div className="auth-card">{children}</div>
        <p className="auth-footer">
          Need help? Ask a manager, or email{' '}
          <a href="mailto:pos.lamattress@gmail.com">pos.lamattress@gmail.com</a>.
        </p>
      </div>
    </main>
  );
}

/** Title, one-line context, the form, and the links under it. */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div>
      <h2 className="auth-title">{title}</h2>
      {subtitle && <p className="auth-subtitle">{subtitle}</p>}
      {children}
      {footer && <div className="auth-links">{footer}</div>}
    </div>
  );
}

/** A finished-state panel: big icon, headline, what happens next. */
export function AuthOutcome({
  tone,
  title,
  children,
  testid,
  actions,
}: {
  tone: 'success' | 'mail' | 'error' | 'secure';
  title: ReactNode;
  children?: ReactNode;
  testid?: string;
  actions?: ReactNode;
}) {
  const Icon =
    tone === 'success'
      ? CheckCircle2
      : tone === 'mail'
        ? MailCheck
        : tone === 'secure'
          ? ShieldCheck
          : XCircle;
  return (
    <div className={`auth-outcome auth-outcome-${tone}`} data-testid={testid}>
      <span className="auth-outcome-icon" aria-hidden>
        <Icon size={28} />
      </span>
      <h2 className="auth-title">{title}</h2>
      {children && <div className="auth-subtitle">{children}</div>}
      {actions && <div className="auth-actions">{actions}</div>}
    </div>
  );
}

export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="auth-link">
      {children}
    </Link>
  );
}
