'use client';

import { createAuthClient } from 'better-auth/react';
import { twoFactorClient } from 'better-auth/client/plugins';

// After Phase 2.21 the API runs same-origin via the Vercel catch-all,
// so we use window.location.origin at runtime. better-auth rejects
// a relative URL, so during SSR (prerender) we feed it a placeholder
// that's never actually used — the client only runs in the browser
// where the resolved origin takes over. Setting NEXT_PUBLIC_API_URL
// is preserved for local dev pointing at a separate API server.
const overrideUrl = process.env.NEXT_PUBLIC_API_URL;
const origin =
  overrideUrl && overrideUrl.length > 0
    ? overrideUrl
    : typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost';

export const authClient = createAuthClient({
  baseURL: `${origin}/api/auth`,
  plugins: [twoFactorClient()],
});

export const { signIn, signUp, signOut, useSession, twoFactor } = authClient;
