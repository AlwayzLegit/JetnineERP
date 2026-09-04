import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { UI_PREFS_BOOTSTRAP } from '@/lib/ui-prefs';
import './globals.css';

export const metadata: Metadata = {
  title: 'LA Mattress ERP',
  description: 'Multi-tenant browser POS and retail operations platform.',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Theme / density before first paint — see lib/ui-prefs.ts. */}
        <script dangerouslySetInnerHTML={{ __html: UI_PREFS_BOOTSTRAP }} />
      </head>
      <body>
        {children}
        {/* BA-0040: bottom-right so toasts never cover the top-bar
            controls (New sale lives top-right). */}
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
