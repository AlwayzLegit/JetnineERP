import type { ReactNode } from 'react';

// All auth pages call better-auth client hooks (useSession etc.)
// at module evaluation. Those hooks can't run during Next's
// prerender pass — there's no React dispatcher — so we opt the
// whole segment out of static generation.
export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: '48px 16px',
      }}
    >
      <div style={{ maxWidth: 400, width: '100%' }}>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            margin: '0 0 16px',
            textAlign: 'center',
            color: 'var(--text)',
          }}
        >
          LA Mattress ERP
        </h1>
        <div className="card" style={{ padding: 24 }}>
          {children}
        </div>
      </div>
    </main>
  );
}
