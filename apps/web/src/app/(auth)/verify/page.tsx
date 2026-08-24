'use client';

import Link from 'next/link';

// better-auth's verification link points directly at the API endpoint
// (`/api/auth/verify-email?token=...&callbackURL=...`). After verifying it
// redirects to callbackURL on the web app, which is this page when no other
// callback is set. We just confirm and offer a sign-in link.
export default function VerifyPage() {
  return (
    <div>
      <h2 style={{ fontSize: 18, margin: '0 0 12px' }}>Email verified</h2>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
        Your email has been confirmed. You can now sign in.
      </p>
      <Link href="/login">Go to sign-in</Link>
    </div>
  );
}
