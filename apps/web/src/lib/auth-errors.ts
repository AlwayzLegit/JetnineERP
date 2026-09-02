/**
 * Turn better-auth / API failures into sentences a cashier can act on
 * (owner 2026-09-02). Codes come from better-auth's error catalogue; the
 * API's ApiError carries `status` and an optional `code`.
 */
export interface AuthFailure {
  code?: string | null;
  message?: string | null;
  status?: number | null;
}

const BY_CODE: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "That email and password don't match. Check both and try again.",
  INVALID_PASSWORD: "That email and password don't match. Check both and try again.",
  INVALID_EMAIL: 'Enter a valid email address.',
  USER_NOT_FOUND: "We couldn't find an account for that email.",
  EMAIL_NOT_VERIFIED: 'Verify your email before signing in — check your inbox for the link.',
  USER_ALREADY_EXISTS: 'An account with this email already exists. Sign in instead.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    'An account with this email already exists. Sign in instead.',
  PASSWORD_TOO_SHORT: 'Use at least 12 characters.',
  PASSWORD_TOO_LONG: 'Use at most 128 characters.',
  INVALID_TOKEN: 'This link is no longer valid. Request a new one below.',
  INVALID_OR_EXPIRED_TOKEN: 'This link has expired. Request a new one below.',
  TOKEN_EXPIRED: 'This link has expired. Request a new one below.',
  INVALID_CODE: "That code didn't work. Codes change every 30 seconds — try the newest one.",
  INVALID_TWO_FACTOR_CODE:
    "That code didn't work. Codes change every 30 seconds — try the newest one.",
  OTP_EXPIRED: 'That code has expired. Enter the newest one from your app.',
  TOO_MANY_ATTEMPTS: 'Too many attempts. Wait a minute and try again.',
  SESSION_EXPIRED: 'Your session ended. Sign in again.',
};

export function authErrorMessage(err: AuthFailure | null | undefined, fallback: string): string {
  if (!err) return fallback;
  if (err.status === 429) return 'Too many attempts. Wait a minute and try again.';
  const code = err.code ?? undefined;
  if (code && BY_CODE[code]) return BY_CODE[code]!;
  const msg = (err.message ?? '').trim();
  if (!msg) return fallback;
  // better-auth messages are terse and title-cased; make them read as a sentence.
  const lower = msg.toLowerCase();
  if (lower.includes('invalid email or password')) return BY_CODE.INVALID_EMAIL_OR_PASSWORD!;
  if (lower.includes('not verified')) return BY_CODE.EMAIL_NOT_VERIFIED!;
  if (lower.includes('already exist')) return BY_CODE.USER_ALREADY_EXISTS!;
  if (lower.includes('expired')) return BY_CODE.INVALID_OR_EXPIRED_TOKEN!;
  if (lower.includes('invalid token')) return BY_CODE.INVALID_TOKEN!;
  if (lower.includes('too many')) return BY_CODE.TOO_MANY_ATTEMPTS!;
  return msg.endsWith('.') ? msg : `${msg}.`;
}

/** True when the failure means "sign-in refused because the email is unverified". */
export function isUnverifiedEmail(err: AuthFailure | null | undefined): boolean {
  if (!err) return false;
  if (err.code === 'EMAIL_NOT_VERIFIED') return true;
  return (err.message ?? '').toLowerCase().includes('not verified');
}
