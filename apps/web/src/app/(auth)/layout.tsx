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
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f7f7f7',
        fontFamily: 'system-ui, sans-serif',
        padding: '48px 16px',
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: '100%',
          background: '#fff',
          padding: '32px',
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>LA Mattress ERP</h1>
        {children}
      </div>
    </main>
  );
}
